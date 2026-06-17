package handler

import (
	"net/http"

	"github.com/amis/medverse-annahl/internal/config"
	"github.com/amis/medverse-annahl/internal/domain"
	"github.com/amis/medverse-annahl/internal/middleware"
	"github.com/amis/medverse-annahl/internal/repository/postgres"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	db        interface{}
	jwtConfig config.JWTConfig
}

func NewAuthHandler(db interface{}, jwtConfig config.JWTConfig) *AuthHandler {
	return &AuthHandler{
		db:        db,
		jwtConfig: jwtConfig,
	}
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	ExpiresIn    int          `json:"expires_in"`
	User         domain.User  `json:"user"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request", "message": err.Error()})
		return
	}

	pool := h.db.(*postgres.PoolWrapper)
	user, err := pool.GetUserByEmail(c.Request.Context(), req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if !user.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User is deactivated"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	accessToken, err := middleware.GenerateAccessToken(user, h.jwtConfig)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	refreshToken, err := middleware.GenerateRefreshToken(user.ID.String(), h.jwtConfig)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
		return
	}

	pool.UpdateLastLogin(c.Request.Context(), user.ID)

	c.JSON(http.StatusOK, LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:   h.jwtConfig.AccessTokenTTL * 60,
		User:         *user,
	})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	claims := &middleware.UserClaims{}
	token, err := jwt.ParseWithClaims(req.RefreshToken, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(h.jwtConfig.Secret), nil
	})

	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	pool := h.db.(*postgres.PoolWrapper)
	user, err := pool.GetUserByID(c.Request.Context(), claims.UserID)
	if err != nil || !user.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found or inactive"})
		return
	}

	accessToken, _ := middleware.GenerateAccessToken(user, h.jwtConfig)
	newRefreshToken, _ := middleware.GenerateRefreshToken(user.ID.String(), h.jwtConfig)

	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": newRefreshToken,
		"expires_in":   h.jwtConfig.AccessTokenTTL * 60,
		"user":          user,
	})
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Password reset functionality not implemented yet"})
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Password reset functionality not implemented yet"})
}