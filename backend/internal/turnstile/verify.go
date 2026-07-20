package turnstile

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

const defaultSiteVerifyURL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

// Client calls Cloudflare Turnstile siteverify (parity with portal-backend).
// Production register is served by essensys-user-portal-backend; this package
// exists only if the legacy support-site backend is redeployed.
type Client struct {
	Secret     string
	HTTPClient *http.Client
	VerifyURL  string
}

func NewClientFromEnv() *Client {
	return &Client{
		Secret:     strings.TrimSpace(os.Getenv("TURNSTILE_SECRET_KEY")),
		HTTPClient: &http.Client{Timeout: 5 * time.Second},
		VerifyURL:  defaultSiteVerifyURL,
	}
}

func Enforced() bool {
	env := strings.ToLower(strings.TrimSpace(os.Getenv("ENV")))
	if env == "" {
		env = strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV")))
	}
	disabled := strings.EqualFold(os.Getenv("TURNSTILE_DISABLED"), "true")
	if env == "production" || env == "prod" {
		return true
	}
	if disabled {
		return false
	}
	return true
}

type siteVerifyResponse struct {
	Success    bool     `json:"success"`
	ErrorCodes []string `json:"error-codes"`
}

func (c *Client) Verify(ctx context.Context, token, remoteIP string) error {
	if c == nil || strings.TrimSpace(c.Secret) == "" {
		return fmt.Errorf("turnstile secret not configured")
	}
	token = strings.TrimSpace(token)
	if token == "" {
		return fmt.Errorf("turnstile token missing")
	}
	form := url.Values{}
	form.Set("secret", c.Secret)
	form.Set("response", token)
	if remoteIP != "" {
		form.Set("remoteip", remoteIP)
	}
	verifyURL := c.VerifyURL
	if verifyURL == "" {
		verifyURL = defaultSiteVerifyURL
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, verifyURL, strings.NewReader(form.Encode()))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	client := c.HTTPClient
	if client == nil {
		client = &http.Client{Timeout: 5 * time.Second}
	}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return err
	}
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("turnstile siteverify HTTP %d", resp.StatusCode)
	}
	var parsed siteVerifyResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return err
	}
	if !parsed.Success {
		return fmt.Errorf("turnstile rejected")
	}
	return nil
}
