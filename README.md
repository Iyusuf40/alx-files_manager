# Files manager

This is an ExpressJS app that exposes an API that mimics a virtual file system. It allows creating directories and storing files in them. It also implements a minimal session auth system. Users can share files with others and users can either make a file public or private. A queue system was also set up on a separate process for endpoints that require file processing so as not to block the application.

## Installation
Clone this repository  
enter into the directory `cd alx-files_manager`  
install dependencies `npm install`

### Note
you have to have [redis](https://redis.io/docs/getting-started/installation/install-redis-on-linux/) and [mongodb](https://www.mongodb.com/docs/manual/tutorial/) installed locally to run this app

## Usage
start the server by running `./start_server.sh`  

## Endpoints
### Get Status
Returns the status of the API.

GET /status  
Response:

```json
{
  "redis": "true",
  "db": "true"
}
```

### Get Stats
Returns the number of users and number of files.

GET /stats
Response:

```json
{
  "users": 10,
  "files": 100
}
```

### Create User
Creates a new user.

POST /users
Payload:

email: The email of the user (required).  
password: The password of the user (required).  
Response:

```json
{
  "id": "user-id",
  "email": "user-email"
}
```

### Connect
Logs the user in and creates a session using Redis and returns the session token.

GET /connect
Response:

```json
{
  "token": "your-session-token"
}
```

### Disconnect
Logs a user out and deletes their session.  

GET /disconnect

### Create File
Creates a new file or directory.

POST /file  
Payload:  

name: The name of the file (required).  
type: The type of the file (required).  
parentId: The ID of the parent directory (optional), defaults to 0 - root.  
data: The data to store in the file (optional).  
Response:  

```json
{
  "userId": "file-id",
  "name": "file-name",
  "type": "file-type",
  "parentId": "parent-directory-id",
  "isPublic": boolean,
}
```

### Get File
Retrieves the details of a file by its ID. 

GET /files/:id  
Response:

```json
{
  "userId": "file-id",
  "name": "file-name",
  "type": "file-type",
  "parentId": "parent-directory-id",
  "isPublic": boolean,
}
```

### Publish File
Makes a file public.

PUT /files/:id/publish  
Response:

```json
{
  "userId": "file-id",
  "name": "file-name",
  "type": "file-type",
  "parentId": "parent-directory-id",
  "isPublic": true,
}
```

### Unpublish File
Makes a file private.

PUT /files/:id/unpublish  
Response:

```json
{
  "userId": "file-id",
  "name": "file-name",
  "type": "file-type",
  "parentId": "parent-directory-id",
  "isPublic": false,
}
```

### Get File Data
Retrieves saved files contents.  

GET /files/:id/data  
Response: Raw bytes

### Get files info Paginated
Returns a paginated (20 pages limit) list of all files info belonging to a user.

GET /files?page=number&parentId=number

Response:

```json
[
  {
    "userId": "file-id",
    "name": "file-name",
    "type": "file-type",
    "parentId": "parent-directory-id",
    "isPublic": boolean,
  },
  ...
]
```

## AUTHORS
[Yusuf Isyaku](https://github.com/Iyusuf40)  
[Valentine Maduagwu](https://github.com/Theocode12)
