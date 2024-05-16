# Wellspring Server

Wellspring Server is the backend component of the Wellspring healthcare management application. It handles all server-side operations including database interactions, authentication, and email notifications.

## Features

- **Authentication:** Uses JSON Web Tokens (JWT) for secure user authentication.
- **Database Management:** Uses MSSQL for storing and retrieving data.
- **Email Notifications:** Uses Nodemailer for sending email notifications to users.
- **Cross-Origin Resource Sharing (CORS):** Allows the client application to interact with the server from a different origin.

## Getting Started

To get started with Wellspring Server, ensure you have Node.js and npm installed on your system. Follow these steps to set up the project:

1. Clone the repository.
   ```bash
   git clone https://github.com/your-username/wellspring-server
   ```
2. Navigate to the project directory.
   ```bash
    cd wellspring-server
    ```
3. Install the dependencies.
    ```bash
    npm i
    ```
5. Start the server.
    ```bash
    npm start
    ```

The server will be running at [http://localhost:5174](http://localhost:5174).

## Dependencies

Wellspring Server uses several dependencies for its operations:

- cors: To enable CORS.
- dotenv: To load environment variables from a .env file.
- express: For building the server.
- jsonwebtoken: For creating JWTs for user authentication.
- mssql: For interacting with the MSSQL database.
- nodemailer: For sending emails.
- nodemon: For automatically restarting the server during development.

## License

Wellspring Server is licensed under the ISC license.

## Contact and Contributions

If you have any questions, issues, or suggestions, please open an issue on our [GitHub repository](https://github.com/Sillor/wellspring-server/issues) or contact us directly.

## Acknowledgements

Wellspring Server was created as part of the Spring 2024 CSC131 class at California State University, Sacramento.
