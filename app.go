package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var (
	SessionId = ""
	UserId    = ""
)

type MultipartData struct {
	Fields map[string]string
	Files  map[string]File
}

func authFetch(method, url string, body interface{}, headers map[string]string) (*http.Response, error) {
	client := &http.Client{}

	var req *http.Request
	var err error

	if multipartBody, ok := body.(MultipartData); ok {
		bodyBuf := &bytes.Buffer{}
		writer := multipart.NewWriter(bodyBuf)

		for key, value := range multipartBody.Fields {
			err = writer.WriteField(key, value)
			if err != nil {
				return nil, fmt.Errorf("error writing field: %w", err)
			}
		}

		for key, file := range multipartBody.Files {
			part, err := writer.CreateFormFile(key, file.Name)
			if err != nil {
				return nil, fmt.Errorf("error creating form file: %w", err)
			}
			_, err = part.Write(file.Data)
			if err != nil {
				return nil, fmt.Errorf("error writing file data: %w", err)
			}
		}

		err = writer.Close()
		if err != nil {
			return nil, fmt.Errorf("error closing multipart writer: %w", err)
		}

		req, err = http.NewRequest(method, url, bodyBuf)
		if err != nil {
			return nil, fmt.Errorf("error creating request: %w", err)
		}

		req.Header.Set("Content-Type", writer.FormDataContentType())
	} else {
		var bodyReader io.Reader
		if body != nil {
			jsonBody, err := json.Marshal(body)
			if err != nil {
				return nil, fmt.Errorf("error marshaling body: %w", err)
			}
			bodyReader = bytes.NewBuffer(jsonBody)
		}

		req, err = http.NewRequest(method, url, bodyReader)
		if err != nil {
			return nil, fmt.Errorf("error creating request: %w", err)
		}

		req.Header.Set("Content-Type", "application/json")
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", SessionId))
	req.Header.Set("X-User-ID", UserId)

	for key, value := range headers {
		req.Header.Set(key, value)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error sending request: %w", err)
	}

	return resp, nil
}

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	runtime.BrowserOpenURL(ctx, "/signin")
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

type SigninRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (a *App) SignIn(request string) map[string]interface{} {
	var req SigninRequest
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	response, err := http.Post(
		fmt.Sprintf("%s/auth/signin", "https://localhost:8080"),
		"application/json",
		strings.NewReader(request),
	)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"name":    "unexpected",
			"message": "Please check your login information and try again.",
		}
	}
	defer response.Body.Close()

	cookies := response.Cookies()
	if len(cookies) > 0 {
		SessionId = cookies[0].Value
	}

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	if response.Status != "200 OK" {
		return result
	}

	userInfos := result["user"].(map[string]interface{})
	UserId = userInfos["id"].(string)

	return result
}

func (a *App) AuthVerify() map[string]interface{} {
	response, err := authFetch("GET", fmt.Sprintf("%s/auth/verify", "https://localhost:8080"), nil, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to signin",
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	if result["message"] == "success" {
		userInfos := result["user"].(map[string]interface{})
		UserId = userInfos["id"].(string)
	}

	return result
}

type generalRequest struct {
	UserID string `json:"user_id"`
}

func (a *App) GetFriends(request string) map[string]interface{} {
	var req generalRequest
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	response, err := authFetch("GET", fmt.Sprintf("%s/api/v1/friends/%s", "https://localhost:8080", req.UserID), nil, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to fetch friends",
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	return result
}

func (a *App) GetServers(request string) map[string]interface{} {
	var req generalRequest
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	response, err := authFetch("GET", fmt.Sprintf("%s/api/v1/servers/%s", "https://localhost:8080", req.UserID), nil, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to fetch servers",
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	return result
}

type MessagesRequest struct {
	ChannelId string `json:"channel_id"`
	UserID    string `json:"user_id"`
}

func (a *App) GetMessages(request string) map[string]interface{} {
	var req MessagesRequest
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	channelUrl := fmt.Sprintf("%s/api/v1/messages/%s", "https://localhost:8080", req.ChannelId)
	friendUrl := fmt.Sprintf("%s/api/v1/messages/%s/private/%s", "https://localhost:8080", req.ChannelId, req.UserID)

	var response *http.Response
	if req.UserID == "" {
		response, err = authFetch("GET", channelUrl, nil, nil)
		if err != nil {
			return map[string]interface{}{
				"status":  500,
				"message": "Failed to fetch messages",
			}
		}
	} else {
		response, err = authFetch("GET", friendUrl, nil, nil)
		if err != nil {
			return map[string]interface{}{
				"status":  500,
				"message": "Failed to fetch messages",
			}
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	return result
}

type ServerRequest struct {
	UserId   string `json:"user_id"`
	ServerId string `json:"server_id"`
}

func (a *App) GetServer(request string) map[string]interface{} {
	var req ServerRequest
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	url := fmt.Sprintf("%s/api/v1/server/%s/%s", "https://localhost:8080", req.UserId, req.ServerId)

	response, err := authFetch("GET", url, nil, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to fetch messages",
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	return result
}

type TypingRequest struct {
	UserId      string `json:"user_id"`
	ChannelId   string `json:"channel_id"`
	DisplayName string `json:"display_name"`
	Status      string `json:"status"`
}

func (a *App) IndicateTyping(request string) map[string]interface{} {
	var req TypingRequest
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	url := fmt.Sprintf("%s/api/v1/channels/typing", "https://localhost:8080")

	response, err := authFetch("POST", url, nil, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to indicate typing",
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	return result
}

type SyncNotifRequest struct {
	UserId   string `json:"user_id"`
	Channels any    `json:"channels"`
}

func (a *App) SyncNotifications(request string) map[string]interface{} {
	var req SyncNotifRequest
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	url := fmt.Sprintf("%s/api/v1/notifications/message_update", "https://localhost:8080")

	response, err := authFetch("POST", url, req, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to sync notifications",
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	return result
}

func (a *App) GetNotifications(request string) map[string]interface{} {
	var req generalRequest
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	url := fmt.Sprintf("%s/api/v1/notifications/%s", "https://localhost:8080", req.UserID)

	response, err := authFetch("GET", url, nil, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to fetch notifications",
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	return result
}

type CreateInviteReq struct {
	UserId   string `json:"user_id"`
	ServerId string `json:"server_id"`
}

func (a *App) CreateInvitation(request string) map[string]interface{} {
	var req CreateInviteReq
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	url := fmt.Sprintf("%s/api/v1/invites/create", "https://localhost:8080")

	response, err := authFetch("POST", url, nil, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to create invitation",
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	return result
}

func (a *App) GetProfile(request string) map[string]interface{} {
	var req generalRequest
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	url := fmt.Sprintf("%s/api/v1/user/%s", "https://localhost:8080", req.UserID)
	response, err := authFetch("GET", url, nil, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to get profile",
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	return result
}

type ServerActionsReq struct {
	UserId   string `json:"user_id"`
	ServerId string `json:"server_id"`
}

func (a *App) DeleteServer(request string) map[string]interface{} {
	var req ServerActionsReq
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	url := fmt.Sprintf("%s/api/v1/server/delete", "https://localhost:8080")
	response, err := authFetch("POST", url, req, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to delete server",
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	return result
}

func (a *App) QuitServer(request string) map[string]interface{} {
	var req ServerActionsReq
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	url := fmt.Sprintf("%s/api/v1/server/leave", "https://localhost:8080")
	response, err := authFetch("POST", url, req, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to quit server",
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	return result
}

type JoinServerReq struct {
	User     interface{} `json:"user"`
	InviteId string      `json:"invite_id"`
}

func (a *App) JoinServer(request string) map[string]interface{} {
	var req JoinServerReq
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	url := fmt.Sprintf("%s/api/v1/server/join", "https://localhost:8080")
	response, err := authFetch("POST", url, req, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to join server",
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	return result
}

type CreateServerReq struct {
	UserId string `json:"user_id"`
	Name   string `json:"name"`
}

func (a *App) CreateServer(request string) map[string]interface{} {
	var req CreateServerReq
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	url := fmt.Sprintf("%s/api/v1/server/create", "https://localhost:8080")
	response, err := authFetch("POST", url, req, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to create server",
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	return result
}

type CatReq struct {
	ServerId     string `json:"server_id"`
	CategoryName string `json:"category_name"`
}

func (a *App) CreateCategory(request string) map[string]interface{} {
	var req CatReq
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	url := fmt.Sprintf("%s/api/v1/category/create", "https://localhost:8080")
	response, err := authFetch("POST", url, req, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to create category",
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	return result
}

func (a *App) DeleteCategory(request string) map[string]interface{} {
	var req CatReq
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	url := fmt.Sprintf("%s/api/v1/category/delete", "https://localhost:8080")
	response, err := authFetch("POST", url, req, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to delete category",
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	return result
}

type DelFriendReq struct {
	UserId   string `json:"user_id"`
	FriendId string `json:"friend_id"`
}

func (a *App) DeleteFriend(request string) map[string]interface{} {
	var req DelFriendReq
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	url := fmt.Sprintf("%s/api/v1/friends/delete", "https://localhost:8080")
	response, err := authFetch("POST", url, req, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to delete friend",
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	return result
}

type FriendReq struct {
	ID        string `json:"id"`
	RequestId string `json:"request_id"`
}

func (a *App) AcceptFriend(request string) map[string]interface{} {
	var req FriendReq
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	url := fmt.Sprintf("%s/api/v1/friends/accept", "https://localhost:8080")
	response, err := authFetch("POST", url, req, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to accept friend request",
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	return result
}

func (a *App) RefuseFriend(request string) map[string]interface{} {
	var req FriendReq
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	url := fmt.Sprintf("%s/api/v1/friends/refuse", "https://localhost:8080")
	response, err := authFetch("POST", url, req, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to refuse friend request",
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	return result
}

type AddFriendReq struct {
	InitiatorId       string `json:"initiator_id"`
	InitiatorUsername string `json:"initiator_username"`
	ReceiverUsername  string `json:"receiver_username"`
}

func (a *App) AddFriend(request string) map[string]interface{} {
	var req AddFriendReq
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	url := fmt.Sprintf("%s/api/v1/friends/add", "https://localhost:8080")
	response, err := authFetch("POST", url, req, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to refuse friend request",
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	return result
}

type File struct {
	Name string
	Data []byte
}

func (a *App) CreateMessage(author any, channelId string, content string, mentions []string, replyTo string, privateMessage bool, serverId string, files []File) map[string]interface{} {
	url := fmt.Sprintf("%s/api/v1/messages/create", "https://localhost:8080")

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	jsonBody := map[string]interface{}{
		"author":          author,
		"channel_id":      channelId,
		"content":         content,
		"mentions":        mentions,
		"reply":           replyTo,
		"private_message": privateMessage,
	}
	jsonData, err := json.Marshal(jsonBody)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Failed to marshal JSON body",
		}
	}
	err = writer.WriteField("body", string(jsonData))
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Failed to write JSON body to form",
		}
	}

	// Add files to the form
	for i, file := range files {
		part, err := writer.CreateFormFile(fmt.Sprintf("file-%d", i), file.Name)
		if err != nil {
			return map[string]interface{}{
				"status":  400,
				"message": fmt.Sprintf("Failed to create form file: %v", err),
			}
		}
		_, err = io.Copy(part, bytes.NewReader(file.Data))
		if err != nil {
			return map[string]interface{}{
				"status":  400,
				"message": fmt.Sprintf("Failed to copy file data: %v", err),
			}
		}
	}

	err = writer.Close()
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Failed to close multipart writer",
		}
	}

	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Failed to create request",
		}
	}

	// Set headers
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", SessionId))
	req.Header.Set("X-User-ID", UserId)

	// Send the request
	client := &http.Client{}
	_, err = client.Do(req)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to send request",
		}
	}

	return nil
}

type DelMessageReq struct {
	ChannelId      string `json:"channel_id"`
	MessageId      string `json:"message_id"`
	PrivateMessage bool   `json:"private_message"`
	AuthorId       string `json:"author_id"`
}

func (a *App) DeleteMessage(request string) map[string]interface{} {
	var req DelMessageReq
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	url := fmt.Sprintf("%s/api/v1/messages/delete", "https://localhost:8080")
	response, err := authFetch("DELETE", url, req, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to delete message",
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	return result
}

type EditMessageReq struct {
	ChannelId      string   `json:"channel_id"`
	MessageId      string   `json:"message_id"`
	PrivateMessage bool     `json:"private_message"`
	AuthorId       string   `json:"author_id"`
	Content        string   `json:"content"`
	Mentions       []string `json:"mentions"`
}

func (a *App) EditMessage(request string) map[string]interface{} {
	var req EditMessageReq
	err := json.Unmarshal([]byte(request), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format",
		}
	}

	url := fmt.Sprintf("%s/api/v1/messages/edit", "https://localhost:8080")
	response, err := authFetch("PUT", url, req, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to refuse friend request",
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(response.Body).Decode(&result)

	return result
}

func (a *App) ChangeBanner(fileData []byte, fileName string, cropY, cropX, cropWidth, cropHeight int, oldBanner string) map[string]interface{} {
	url := fmt.Sprintf("%s/api/v1/user/change_banner", "https://localhost:8080")

	body := MultipartData{
		Fields: map[string]string{
			"cropY":      fmt.Sprintf("%d", cropY),
			"cropX":      fmt.Sprintf("%d", cropX),
			"cropWidth":  fmt.Sprintf("%d", cropWidth),
			"cropHeight": fmt.Sprintf("%d", cropHeight),
			"old_banner": oldBanner,
		},
		Files: map[string]File{
			"banner": {
				Name: fileName,
				Data: fileData,
			},
		},
	}

	response, err := authFetch("POST", url, body, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to change banner: " + err.Error(),
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	err = json.NewDecoder(response.Body).Decode(&result)
	if err != nil {
		return map[string]interface{}{"error": "Failed to parse response"}
	}

	return result
}

type AvatarChangeRequest struct {
	FileData   []byte   `json:"fileData"`
	FileName   string   `json:"fileName"`
	CropY      int      `json:"cropY"`
	CropX      int      `json:"cropX"`
	CropWidth  int      `json:"cropWidth"`
	CropHeight int      `json:"cropHeight"`
	OldAvatar  string   `json:"oldAvatar"`
	ServerID   string   `json:"serverId,omitempty"`
	Friends    []string `json:"friends,omitempty"`
}

func (a *App) ChangeAvatar(requestJSON string) map[string]interface{} {
	var req AvatarChangeRequest
	err := json.Unmarshal([]byte(requestJSON), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format: " + err.Error(),
		}
	}

	url := fmt.Sprintf("%s/api/v1/user/change_avatar", "https://localhost:8080")

	body := MultipartData{
		Fields: map[string]string{
			"cropY":      fmt.Sprintf("%d", req.CropY),
			"cropX":      fmt.Sprintf("%d", req.CropX),
			"cropWidth":  fmt.Sprintf("%d", req.CropWidth),
			"cropHeight": fmt.Sprintf("%d", req.CropHeight),
			"old_avatar": req.OldAvatar,
		},
		Files: map[string]File{
			"avatar": {
				Name: req.FileName,
				Data: req.FileData,
			},
		},
	}

	if req.ServerID != "" {
		body.Fields["server_id"] = req.ServerID
	}
	if len(req.Friends) > 0 {
		friendsJSON, _ := json.Marshal(req.Friends)
		body.Fields["friends"] = string(friendsJSON)
	}

	response, err := authFetch("POST", url, body, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to change banner: " + err.Error(),
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	err = json.NewDecoder(response.Body).Decode(&result)
	if err != nil {
		return map[string]interface{}{"error": "Failed to parse response"}
	}

	return result
}

type NameColorReq struct {
	UserId        string `json:"user_id"`
	UsernameColor string `json:"username_color"`
}

func (a *App) ChangeNameColor(requestJSON string) map[string]interface{} {
	var req NameColorReq
	err := json.Unmarshal([]byte(requestJSON), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format: " + err.Error(),
		}
	}

	url := fmt.Sprintf("%s/api/v1/user/change_name_color", "https://localhost:8080")

	response, err := authFetch("POST", url, req, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to change name color: " + err.Error(),
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	err = json.NewDecoder(response.Body).Decode(&result)
	if err != nil {
		return map[string]interface{}{"error": "Failed to parse response"}
	}

	return result
}

type DelChanReq struct {
	ChannelId    string `json:"channel_id"`
	CategoryName string `json:"category_name"`
	ServerId     string `json:"server_id"`
}

func (a *App) DeleteChannel(requestJSON string) map[string]interface{} {
	var req DelChanReq
	err := json.Unmarshal([]byte(requestJSON), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format: " + err.Error(),
		}
	}

	url := fmt.Sprintf("%s/api/v1/channels/delete", "https://localhost:8080")

	response, err := authFetch("POST", url, req, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to delete channel: " + err.Error(),
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	err = json.NewDecoder(response.Body).Decode(&result)
	if err != nil {
		return map[string]interface{}{"error": "Failed to parse response"}
	}

	return result
}

type CreateChanReq struct {
	Name         string `json:"name"`
	ChannelType  string `json:"channel_type"`
	CategoryName string `json:"category_name"`
	ServerId     string `json:"server_id"`
}

func (a *App) CreateChannel(requestJSON string) map[string]interface{} {
	var req CreateChanReq
	err := json.Unmarshal([]byte(requestJSON), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format: " + err.Error(),
		}
	}

	url := fmt.Sprintf("%s/api/v1/channels/create", "https://localhost:8080")

	response, err := authFetch("POST", url, req, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to create channel: " + err.Error(),
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	err = json.NewDecoder(response.Body).Decode(&result)
	if err != nil {
		return map[string]interface{}{"error": "Failed to parse response"}
	}

	return result
}

type DPNameReq struct {
	UserId string `json:"user_id"`
	DPName string `json:"display_name"`
}

func (a *App) ChangeDPName(requestJSON string) map[string]interface{} {
	var req DPNameReq
	err := json.Unmarshal([]byte(requestJSON), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format: " + err.Error(),
		}
	}

	url := fmt.Sprintf("%s/api/v1/user/change_name", "https://localhost:8080")

	response, err := authFetch("POST", url, req, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to change dp name: " + err.Error(),
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	err = json.NewDecoder(response.Body).Decode(&result)
	if err != nil {
		return map[string]interface{}{"error": "Failed to parse response"}
	}

	return result
}

type UserNameReq struct {
	UserId string `json:"user_id"`
	Name   string `json:"username"`
}

func (a *App) ChangeUsername(requestJSON string) map[string]interface{} {
	var req UserNameReq
	err := json.Unmarshal([]byte(requestJSON), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format: " + err.Error(),
		}
	}

	url := fmt.Sprintf("%s/api/v1/user/change_username", "https://localhost:8080")

	response, err := authFetch("POST", url, req, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to change username: " + err.Error(),
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	err = json.NewDecoder(response.Body).Decode(&result)
	if err != nil {
		return map[string]interface{}{"error": "Failed to parse response"}
	}

	return result
}

type ChangeEmailReq struct {
	UserId string `json:"user_id"`
	Email  string `json:"email"`
}

func (a *App) ChangeEmail(requestJSON string) map[string]interface{} {
	var req ChangeEmailReq
	err := json.Unmarshal([]byte(requestJSON), &req)
	if err != nil {
		return map[string]interface{}{
			"status":  400,
			"message": "Invalid request format: " + err.Error(),
		}
	}

	url := fmt.Sprintf("%s/api/v1/user/change_email", "https://localhost:8080")

	response, err := authFetch("POST", url, req, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to change email: " + err.Error(),
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	err = json.NewDecoder(response.Body).Decode(&result)
	if err != nil {
		return map[string]interface{}{"error": "Failed to parse response"}
	}

	return result
}

func (a *App) LogoutHudori() map[string]interface{} {
	url := fmt.Sprintf("%s/api/v1/user/logout", "https://localhost:8080")

	response, err := authFetch("POST", url, nil, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to logout: " + err.Error(),
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	err = json.NewDecoder(response.Body).Decode(&result)
	if err != nil {
		return map[string]interface{}{"error": "Failed to parse response"}
	}

	SessionId = ""
	UserId = ""

	return result
}

func (a *App) IsAuthenticated() map[string]interface{} {
	if SessionId == "" && UserId == "" {
		return map[string]interface{}{
			"status": "401",
		}
	}

	return map[string]interface{}{
		"status": "200",
	}
}

func (a *App) GenerateRoomToken(channelId, userId string) map[string]interface{} {
	url := fmt.Sprintf("%s/api/v1/rtc/%s/%s}", "https://localhost:8080", channelId, userId)

	response, err := authFetch("POST", url, nil, nil)
	if err != nil {
		return map[string]interface{}{
			"status":  500,
			"message": "Failed to create room token: " + err.Error(),
		}
	}
	defer response.Body.Close()

	var result map[string]interface{}
	err = json.NewDecoder(response.Body).Decode(&result)
	if err != nil {
		return map[string]interface{}{"error": "Failed to parse response"}
	}

	return result
}
