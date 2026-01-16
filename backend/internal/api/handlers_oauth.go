package api

import (
    "context"
    "crypto/rand"
    "encoding/base64"
    "encoding/json"
    "fmt"
    "io"
    "log"
    "net/http"
    "os"
    "strings"
    "time"

    "golang.org/x/oauth2"
    "golang.org/x/oauth2/google"
    "github.com/golang-jwt/jwt/v4"
)

var (
    googleOauthConfig *oauth2.Config
    jwtKey            []byte
)

func init() {
    // These will be loaded when handlers are initialized or on first request if we prefer dynamic
    // But init() is fine for now, or we can load in NewRouter
}

func getOAuthConfig() *oauth2.Config {
    if googleOauthConfig == nil {
        googleOauthConfig = &oauth2.Config{
            RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
            ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
            ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
            Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email"},
            Endpoint:     google.Endpoint,
        }
    }
    return googleOauthConfig
}

func getJWTKey() []byte {
    if len(jwtKey) == 0 {
        key := os.Getenv("JWT_SECRET")
        if key == "" {
            key = "default-insecure-jwt-secret-change-me"
        }
        jwtKey = []byte(key)
    }
    return jwtKey
}

// HandleGoogleLogin redirects user to Google for Auth
func (r *Router) HandleGoogleLogin(w http.ResponseWriter, req *http.Request) {
    oauthState := generateStateOauthCookie(w)
    u := getOAuthConfig().AuthCodeURL(oauthState)
    http.Redirect(w, req, u, http.StatusTemporaryRedirect)
}

// HandleGoogleCallback handles the callback from Google
func (r *Router) HandleGoogleCallback(w http.ResponseWriter, req *http.Request) {
    // 1. Verify State
    oauthState, _ := req.Cookie("oauthstate")
    if req.FormValue("state") != oauthState.Value {
        log.Println("Invalid oauth google state")
        http.Redirect(w, req, "/", http.StatusTemporaryRedirect)
        return
    }

    // 2. Exchange Code for Token
    data, err := getUserDataFromGoogle(req.FormValue("code"))
    if err != nil {
        log.Println(err.Error())
        http.Redirect(w, req, "/", http.StatusTemporaryRedirect)
        return
    }

    // 3. User Data (Email)
    var user struct {
        Email string `json:"email"`
        ID    string `json:"id"`
    }
    if err := json.Unmarshal(data, &user); err != nil {
        log.Println("Failed to parse user data")
        http.Error(w, "Failed to parse user data", http.StatusInternalServerError)
        return
    }

    // 4. Check Allowlist (Simple Env Var: COMMA,SEPARATED,EMAILS)
    allowedEmails := os.Getenv("ADMIN_EMAILS")
    isAllowed := false
    if allowedEmails == "" {
        // If no list defined, maybe allow none or allow specific hardcoded?
        // Let's safe-fail generally, but for now we might want to warn.
        log.Println("WARNING: ADMIN_EMAILS not set. No one can log in via Google.")
    } else {
        parts := strings.Split(allowedEmails, ",")
        for _, email := range parts {
            if strings.TrimSpace(email) == user.Email {
                isAllowed = true
                break
            }
        }
    }

    if !isAllowed {
        log.Printf("Unauthorized Google Login attempt: %s", user.Email)
        http.Error(w, "Unauthorized: Email not in admin list", http.StatusForbidden)
        return
    }
    
    // 5. Generate JWT
    expirationTime := time.Now().Add(24 * time.Hour)
    claims := &jwt.RegisteredClaims{
        Subject:   user.Email,
        ExpiresAt: jwt.NewNumericDate(expirationTime),
        Issuer:    "essensys-backend",
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, err := token.SignedString(getJWTKey())
    if err != nil {
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    // 6. Redirect to Frontend with Token
    // We can set a cookie or pass it in URL hash. URL hash is safer for SPA than query param (doesn't hit server logs)
    // Assuming Frontend is at "/", we redirect to /#/auth?token=...
    frontendURL := os.Getenv("FRONTEND_URL")
    if frontendURL == "" {
        frontendURL = "/" 
    }
    
    // Using a simpler approach: Set a cookie and redirect to admin
    http.SetCookie(w, &http.Cookie{
        Name:    "admin_token",
        Value:   tokenString,
        Expires: expirationTime,
        Path:    "/",
        // HttpOnly: true, // If we want JS to access it, false. If we want Secure, true.
        // For simple Admin SPA, often JS needs it to send in Bearer header, OR we use cookie auth.
        // Let's stick to Header Auth on backend, so Frontend needs to read it.
        // Or we can just pass it as query param.
    })
    
    // Redirect to Admin Dashboard
    http.Redirect(w, req, frontendURL + "admin?token=" + tokenString, http.StatusTemporaryRedirect)
}

func getUserDataFromGoogle(code string) ([]byte, error) {
    token, err := getOAuthConfig().Exchange(context.Background(), code)
    if err != nil {
        return nil, fmt.Errorf("code exchange wrong: %s", err.Error())
    }
    response, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
    if err != nil {
        return nil, fmt.Errorf("failed getting user info: %s", err.Error())
    }
    defer response.Body.Close()
    contents, err := io.ReadAll(response.Body)
    if err != nil {
        return nil, fmt.Errorf("failed reading response body: %s", err.Error())
    }
    return contents, nil
}

func generateStateOauthCookie(w http.ResponseWriter) string {
    var expiration = time.Now().Add(20 * time.Minute)
    b := make([]byte, 16)
    rand.Read(b)
    state := base64.URLEncoding.EncodeToString(b)
    cookie := http.Cookie{Name: "oauthstate", Value: state, Expires: expiration, HttpOnly: true}
    http.SetCookie(w, &cookie)
    return state
}
