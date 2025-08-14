## Running the Application

This is a browser-based application that needs to be served by a local web server to function correctly. Opening the `index.html` file directly will result in a CORS error, and the application will not work.

To run the application:

1.  Make sure you have Python installed.
2.  Run the following command in your terminal from the root directory of this project:

    ```bash
    python server.py
    ```

3.  Open your web browser and navigate to `http://localhost:8000`.

This will start a simple web server and serve the application files, allowing the JavaScript modules to be loaded correctly.
