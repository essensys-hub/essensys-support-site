package api

import (
    "context"
    "crypto/rand"
    "crypto/x509"
    "encoding/pem"
    "encoding/base64"
    "encoding/json"
    "fmt"
    "io"
    "log"
    "net/http"
    "os"
    "strings"
    "time"
    "net/url"

    "golang.org/x/oauth2"
    "golang.org/x/oauth2/google"
    "github.com/golang-jwt/jwt/v4"
    "github.com/essensys-hub/essensys-support-site/backend/internal/models"
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
    oauthState, err := req.Cookie("oauthstate")
    if err != nil {
        log.Println("OAuth cookie missing in Google callback")
        http.Redirect(w, req, "/", http.StatusTemporaryRedirect)
        return
    }

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
    // 4. Persistence & Role Management
    userDB, err := r.UserStore.GetUserByEmail(user.Email)
    if err != nil {
        log.Println("Database error checking user:", err)
        http.Redirect(w, req, "/", http.StatusTemporaryRedirect)
        return
    }

    var role string

    if userDB == nil {
        // Create new user
        // Check if admin based on env list
        isAdmin := r.IsAdminEmail(user.Email, os.Getenv("ADMIN_EMAILS"))
        if isAdmin {
            role = models.RoleAdmin
        } else {
            role = models.RoleUser
        }

        newUser := &models.User{
            Email:      user.Email,
            Role:       role,
            FirstName:  "", // Google might return Name, but we parsed struct above with only Email/ID. 
            // In a fuller implementation we'd grab Name from 'data' map or struct.
            LastName:   "",
            Provider:   models.ProviderGoogle,
            ProviderID: user.ID,
            CreatedAt:  time.Now(),
            LastLogin:  time.Now(),
        }

        if err := r.UserStore.CreateUser(newUser); err != nil {
            log.Println("Failed to create user from Google:", err)
             http.Redirect(w, req, "/", http.StatusTemporaryRedirect)
             return
        }
        userDB = newUser // for ID
    } else {
        // User exists, update login
        r.UserStore.UpdateLastLogin(userDB.ID)
        role = userDB.Role
    }
    
    // 5. Generate JWT
    // 5. Generate JWT
    expirationTime := time.Now().Add(24 * time.Hour)
    tokenString, err := GenerateJWT(user.Email, role, expirationTime)
    if err != nil {
        log.Println("Failed to generate token:", err)
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
    cookie := http.Cookie{
        Name:     "oauthstate",
        Value:    state,
        Expires:  expiration,
        HttpOnly: true,
        Secure:   true,                // Required for SameSite=None
        SameSite: http.SameSiteNoneMode, // Required for POST callback
        Path:     "/",
    }
    http.SetCookie(w, &cookie)
    return state
}

// ---------------------------------------------------------------------
// APPLE SIGN-IN
// ---------------------------------------------------------------------

func getAppleOAuthConfig() *oauth2.Config {
    return &oauth2.Config{
        ClientID:     os.Getenv("APPLE_CLIENT_ID"), // The Service ID (e.g. fr.essensys.web)
        RedirectURL:  os.Getenv("APPLE_REDIRECT_URL"),
        Scopes:       []string{"name", "email"},
        Endpoint: oauth2.Endpoint{
            AuthURL:  "https://appleid.apple.com/auth/authorize",
            TokenURL: "https://appleid.apple.com/auth/token",
        },
    }
}

// GenerateClientSecret generates a JWT signed with the P8 key for Apple Auth
func generateAppleClientSecret() (string, error) {
    teamID := os.Getenv("APPLE_TEAM_ID")
    clientID := os.Getenv("APPLE_CLIENT_ID")
    keyID := os.Getenv("APPLE_KEY_ID")
    keyFile := os.Getenv("APPLE_KEY_FILE")

    // Read P8 file
    keyBytes, err := os.ReadFile(keyFile)
    if err != nil {
        return "", fmt.Errorf("could not read private key file: %v", err)
    }

    block, _ := pem.Decode(keyBytes)
    if block == nil {
        return "", fmt.Errorf("failed to decode PEM block containing private key")
    }

    privateKey, err := x509.ParsePKCS8PrivateKey(block.Bytes)
    if err != nil {
        return "", fmt.Errorf("could not parse private key: %v", err)
    }

    // Create JWT
    token := jwt.NewWithClaims(jwt.SigningMethodES256, jwt.MapClaims{
        "iss": teamID,
        "iat": time.Now().Unix(),
        "exp": time.Now().Add(5 * time.Minute).Unix(), // Max 6 months, but 5 mins is enough for a token request
        "aud": "https://appleid.apple.com",
        "sub": clientID,
    })

    token.Header["kid"] = keyID
    
    return token.SignedString(privateKey)
}

func (r *Router) HandleAppleLogin(w http.ResponseWriter, req *http.Request) {
    oauthState := generateStateOauthCookie(w)
    // response_mode=form_post is required/default for Apple scope email/name
    authURL := getAppleOAuthConfig().AuthCodeURL(oauthState, oauth2.SetAuthURLParam("response_mode", "form_post"))
    http.Redirect(w, req, authURL, http.StatusTemporaryRedirect)
}

// Apple sends a POST request to the callback URL
func (r *Router) HandleAppleCallback(w http.ResponseWriter, req *http.Request) {
    // 1. Verify State
    oauthState, err := req.Cookie("oauthstate")
    if err != nil {
        log.Printf("OAuth cookie missing in Apple callback. Headers: %v", req.Header)
        http.Redirect(w, req, "/", http.StatusTemporaryRedirect)
        return
    }

    if req.FormValue("state") != oauthState.Value {
        log.Println("Invalid oauth apple state")
        http.Redirect(w, req, "/", http.StatusSeeOther)
        return
    }

    code := req.FormValue("code")
    if code == "" {
        http.Error(w, "No code returned from Apple", http.StatusBadRequest)
        return
    }

    // 2. Generate Client Secret (JWT)
    clientSecret, err := generateAppleClientSecret()
    if err != nil {
        log.Printf("Failed to generate apple client secret: %v", err)
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    // 3. Exchange Code for Token
    // We must manually add client_secret because it's dynamic
    conf := getAppleOAuthConfig()
    
    // Custom Token Exchange to inject dynamic client_secret
    values := url.Values{}
    values.Set("client_id", conf.ClientID)
    values.Set("client_secret", clientSecret)
    values.Set("code", code)
    values.Set("grant_type", "authorization_code")
    values.Set("redirect_uri", conf.RedirectURL)

    resp, err := http.PostForm(conf.Endpoint.TokenURL, values)
    if err != nil {
        log.Printf("Failed to exchange token with Apple: %v", err)
        http.Redirect(w, req, "/", http.StatusTemporaryRedirect)
        return
    }
    defer resp.Body.Close()

    bodyBytes, err := io.ReadAll(resp.Body)
    if err != nil {
        log.Printf("Failed to read Apple response body: %v", err)
        http.Redirect(w, req, "/", http.StatusSeeOther)
        return
    }

    if resp.StatusCode != http.StatusOK {
        log.Printf("Apple Token Exchange failed. Status: %d, Body: %s", resp.StatusCode, string(bodyBytes))
        http.Redirect(w, req, "/", http.StatusSeeOther)
        return
    }

    var tokenResp struct {
        AccessToken string `json:"access_token"`
        IDToken     string `json:"id_token"`
        ExpiresIn   int    `json:"expires_in"`
    }

    if err := json.Unmarshal(bodyBytes, &tokenResp); err != nil {
        log.Printf("Failed to decode Apple token response: %v. Body: %s", err, string(bodyBytes))
        http.Redirect(w, req, "/", http.StatusSeeOther)
        return
    }

    // 4. Parse ID Token to get Email
    // Note: Apple only returns "user" object (name/email) on the FIRST login. 
    // Subsequent logins only have email in ID Token.
    
    // We parse ID Token (JWT) without verification for now (or verify generic signature)
    // In strict prod, we should verify against Apple public keys.
    parser := jwt.Parser{SkipClaimsValidation: true}
    idToken, _, err := parser.ParseUnverified(tokenResp.IDToken, jwt.MapClaims{})
    if err != nil {
        log.Printf("Failed to parse ID Token: %v. IDToken: %s", err, tokenResp.IDToken)
        http.Redirect(w, req, "/", http.StatusSeeOther)
        return
    }

    claims, ok := idToken.Claims.(jwt.MapClaims)
    if !ok {
         log.Println("Invalid ID Token claims")
         http.Redirect(w, req, "/", http.StatusSeeOther)
         return
    }

    email, _ := claims["email"].(string) // Apple guarantees email in ID Token
    // sub, _ := claims["sub"].(string)

    // 5. Persistence
    userDB, err := r.UserStore.GetUserByEmail(email)
    if err != nil {
        log.Println("Database error checking user:", err)
        http.Redirect(w, req, "/", http.StatusSeeOther)
        return
    }

    var role string
    if userDB == nil {
         // Create User
         isAdmin := r.IsAdminEmail(email, os.Getenv("ADMIN_EMAILS"))
         if isAdmin {
             role = models.RoleAdmin
         } else {
             role = models.RoleUser
         }
         
         newUser := &models.User{
            Email:      email,
            Role:       role,
            Provider:   models.ProviderApple,
            CreatedAt:  time.Now(),
            LastLogin:  time.Now(),
        }
        
        if err := r.UserStore.CreateUser(newUser); err != nil {
             log.Println("Failed to create user from Apple:", err)
             http.Redirect(w, req, "/", http.StatusSeeOther)
             return
        }
        userDB = newUser
    } else {
        r.UserStore.UpdateLastLogin(userDB.ID)
        role = userDB.Role
    }

    // 6. Generate Session JWT
    // 6. Generate Session JWT
    expirationTime := time.Now().Add(24 * time.Hour)
    tokenString, err := GenerateJWT(email, role, expirationTime)
    if err != nil {
        log.Println("Failed to generate token:", err)
        http.Error(w, "Internal Server Error", http.StatusInternalServerError)
        return
    }

    // 7. Redirect to Frontend
    frontendURL := os.Getenv("FRONTEND_URL")
    if frontendURL == "" {
        frontendURL = "/" 
    }
    
    // Important: Apple callback is a POST, so we must redirect with 303 See Other to turn it into a GET
    http.Redirect(w, req, frontendURL + "admin?token=" + tokenString, http.StatusSeeOther)
}
