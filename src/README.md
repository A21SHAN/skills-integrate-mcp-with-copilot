# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Teacher login/logout for protected actions
- Sign up and unregister students from activities (teachers only)

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| POST   | `/auth/login`                                                     | Log in a teacher and receive a session token                        |
| POST   | `/auth/logout`                                                    | Log out a teacher session                                            |
| GET    | `/auth/session`                                                   | Validate the current teacher session token                          |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Register a student for an activity (teacher only)                   |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Unregister a student from an activity (teacher only)            |

For teacher-only endpoints, include the `X-Teacher-Token` header from `/auth/login`.

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All activity data and active teacher sessions are stored in memory, which means they reset when the server restarts.

## Teacher Credentials

Teacher usernames and passwords are stored in `teachers.json` and validated by the backend.
Default accounts:

- `ms.harper` / `greenhouse123`
- `mr.ramirez` / `falcon2026`
