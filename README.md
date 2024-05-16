# AI-Tutor

An AI tutor for students.

## Description

AI-Tutor is a AI-based tutor designed to assist students in their learning process by providing intelligent responses and guidance.

## Getting Started

### Dependencies

Ensure you have the following installed:

- Node.js
- npm (Node Package Manager)

### Installing

Follow these steps to set up the project on your local machine:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/VictorCentennial/AI-Tutor.git
   cd AI-Tutor
   ```

2. **Install server dependencies**:

   ```bash
   cd AI-Server
   npm install
   ```

3. **Install client dependencies**:

   ```bash
   cd ../AI-Tutor-Client
   npm install
   ```

4. **Configure environment variables**:

   - Go to the `AI-Server` folder.
   - Copy the `.env.template` file and rename it to `.env`.
   - Edit the `.env` file and input your `GOOGLE_API_KEY`.

   You can obtain the Google API Key from [Google Cloud Platform](https://console.cloud.google.com/apis/credentials).

### Executing Program

To run the program, follow these steps:

1. **Start the server**:

   ```bash
   cd AI-Server
   npm run dev
   ```

2. **Start the client**:
   ```bash
   cd ../AI-Tutor-Client
   npm run dev
   ```

## Help

If you encounter any issues or have questions, please refer to the following:

- Check the console for error messages.
- Ensure all dependencies are installed correctly.
- Verify that the `.env` file is correctly configured with your API key.

## Authors

- **ILIA NIKA**
- **Victor Tse**
- **Namneet Kaur Tung**

## Version History

- 0.1
  - Initial Release

## License

## Acknowledgments
