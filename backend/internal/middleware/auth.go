package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/amis/medverse-annahl/internal/config"
	"github.com/amis/medverse-annahl/internal/domain"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type UserClaims struct {
	UserID   string `json:"user_id"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	ClinicID string `json:"clinic_id,omitempty"`
	BranchID string `json:"branch_id,omitempty"`
	jwt.RegisteredClaims
}

type Middleware struct {
	jwtConfig config.JWTConfig
	userRepo  UserRepository
}

type UserRepository interface {
	GetByID(ctx interface{}, id string) (*domain.User, error)
}

func NewMiddleware(jwtConfig config.JWTConfig, userRepo UserRepository) *Middleware {
	return &Middleware{
		jwtConfig: jwtConfig,
		userRepo:  userRepo,
	}
}

func (m *Middleware) Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims := &UserClaims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(m.jwtConfig.Secret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		if claims.ExpiresAt != nil && claims.ExpiresAt.Time.Before(time.Now()) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token expired"})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		c.Set("clinic_id", claims.ClinicID)
		c.Set("branch_id", claims.BranchID)

		c.Next()
	}
}

func (m *Middleware) RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Role not found"})
			c.Abort()
			return
		}

		userRoleStr, ok := userRole.(string)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid role format"})
			c.Abort()
			return
		}

		for _, role := range roles {
			if userRoleStr == role || userRoleStr == "super_admin" {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		c.Abort()
	}
}

func (m *Middleware) ClinicContext() gin.HandlerFunc {
	return func(c *gin.Context) {
		clinicID, exists := c.Get("clinic_id")
		if !exists || clinicID == "" {
			c.Set("clinic_id", "550e8400-e29b-41d4-a716-446655440001")
		}

		branchID, exists := c.Get("branch_id")
		if !exists || branchID == "" {
			c.Set("branch_id", "550e8400-e29b-41d4-a716-446655440002")
		}

		c.Next()
	}
}

func GenerateAccessToken(user *domain.User, jwtConfig config.JWTConfig) (string, error) {
	claims := UserClaims{
		UserID:   user.ID.String(),
		Email:    user.Email,
		Role:     user.Role,
		ClinicID: "",
		BranchID: "",
	}

	if user.ClinicID != nil {
		claims.ClinicID = user.ClinicID.String()
	}
	if user.BranchID != nil {
		claims.BranchID = user.BranchID.String()
	}

	claims.ExpiresAt = jwt.NewNumericDate(time.Now().Add(time.Duration(jwtConfig.AccessTokenTTL) * time.Minute))
	claims.IssuedAt = jwt.NewNumericDate(time.Now())

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtConfig.Secret))
}

func GenerateRefreshToken(userID string, jwtConfig config.JWTConfig) (string, error) {
	claims := jwt.RegisteredClaims{
		Subject:   userID,
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(jwtConfig.RefreshTokenTTL) * time.Minute)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtConfig.Secret))
}