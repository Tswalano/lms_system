"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const client_s3_1 = require("@aws-sdk/client-s3");
const promise_1 = __importDefault(require("mysql2/promise"));
// Clients
const secretsManagerClient = new client_secrets_manager_1.SecretsManagerClient({});
// AWS Configuration
const secretsManager = new client_secrets_manager_1.SecretsManagerClient({ region: "af-south-1" });
const s3Client = new client_s3_1.S3Client({ region: "af-south-1" });
const secretName = "lmsProduction";
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "lms-sick-notes-bucket";
// Database Connection & utilities
class DatabaseService {
    static async getDatabaseCredentials() {
        try {
            const input = { SecretId: "lmsProduction" };
            const command = new client_secrets_manager_1.GetSecretValueCommand(input);
            const response = await secretsManagerClient.send(command);
            if (!response.SecretString) {
                throw new Error("Secret string is empty");
            }
            const secretString = JSON.parse(response.SecretString);
            const { username, password, host, port } = secretString;
            if (!username || !password || !host || !port) {
                throw new Error("Missing required database credentials");
            }
            return { username, password, host, port };
        }
        catch (error) {
            console.error("Error retrieving database credentials:", error);
            throw error;
        }
    }
    static async createConnection() {
        try {
            const { username, password, host, port } = await this.getDatabaseCredentials();
            return await promise_1.default.createConnection({
                host,
                port,
                user: username,
                password,
                database: "lms_db",
                ssl: 'Amazon RDS'
            });
        }
        catch (error) {
            console.error("Error creating database connection:", error);
            throw error;
        }
    }
}
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWJhc2VIZWxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRhdGFiYXNlSGVsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsNEVBQThGO0FBQzlGLGtEQUE4QztBQUM5Qyw2REFBbUM7QUFFbkMsVUFBVTtBQUNWLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSw2Q0FBb0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQWlCMUQsb0JBQW9CO0FBQ3BCLE1BQU0sY0FBYyxHQUFHLElBQUksNkNBQW9CLENBQUMsRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQztBQUMxRSxNQUFNLFFBQVEsR0FBRyxJQUFJLG9CQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQztBQUN4RCxNQUFNLFVBQVUsR0FBRyxlQUFlLENBQUM7QUFDbkMsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLElBQUksdUJBQXVCLENBQUM7QUFFN0Usa0NBQWtDO0FBQ2xDLE1BQU0sZUFBZTtJQUNULE1BQU0sQ0FBQyxLQUFLLENBQUMsc0JBQXNCO1FBQ3ZDLElBQUksQ0FBQztZQUNELE1BQU0sS0FBSyxHQUFHLEVBQUUsUUFBUSxFQUFFLGVBQWUsRUFBRSxDQUFDO1lBQzVDLE1BQU0sT0FBTyxHQUFHLElBQUksOENBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDakQsTUFBTSxRQUFRLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFMUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDekIsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBQzlDLENBQUM7WUFFRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUN2RCxNQUFNLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsWUFBWSxDQUFDO1lBRXhELElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDM0MsTUFBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1lBQzdELENBQUM7WUFFRCxPQUFPLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUM7UUFDOUMsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLHdDQUF3QyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQy9ELE1BQU0sS0FBSyxDQUFDO1FBQ2hCLENBQUM7SUFDTCxDQUFDO0lBRUQsTUFBTSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0I7UUFDekIsSUFBSSxDQUFDO1lBQ0QsTUFBTSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7WUFDL0UsT0FBTyxNQUFNLGlCQUFLLENBQUMsZ0JBQWdCLENBQUM7Z0JBQ2hDLElBQUk7Z0JBQ0osSUFBSTtnQkFDSixJQUFJLEVBQUUsUUFBUTtnQkFDZCxRQUFRO2dCQUNSLFFBQVEsRUFBRSxRQUFRO2dCQUNsQixHQUFHLEVBQUUsWUFBWTthQUNwQixDQUFDLENBQUM7UUFDUCxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMscUNBQXFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDNUQsTUFBTSxLQUFLLENBQUM7UUFDaEIsQ0FBQztJQUNMLENBQUM7Q0FDSjtBQUVRLDBDQUFlIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2VjcmV0c01hbmFnZXJDbGllbnQsIEdldFNlY3JldFZhbHVlQ29tbWFuZCB9IGZyb20gXCJAYXdzLXNkay9jbGllbnQtc2VjcmV0cy1tYW5hZ2VyXCI7XG5pbXBvcnQgeyBTM0NsaWVudCB9IGZyb20gXCJAYXdzLXNkay9jbGllbnQtczNcIjtcbmltcG9ydCBteXNxbCBmcm9tICdteXNxbDIvcHJvbWlzZSc7XG5cbi8vIENsaWVudHNcbmNvbnN0IHNlY3JldHNNYW5hZ2VyQ2xpZW50ID0gbmV3IFNlY3JldHNNYW5hZ2VyQ2xpZW50KHt9KTtcblxuLy8gSW50ZXJmYWNlc1xuaW50ZXJmYWNlIERhdGFiYXNlQ3JlZGVudGlhbHMge1xuICAgIHVzZXJuYW1lOiBzdHJpbmc7XG4gICAgcGFzc3dvcmQ6IHN0cmluZztcbiAgICBob3N0OiBzdHJpbmc7XG4gICAgcG9ydDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERCU2VjcmV0IHtcbiAgICBob3N0OiBzdHJpbmc7XG4gICAgdXNlcm5hbWU6IHN0cmluZztcbiAgICBwYXNzd29yZDogc3RyaW5nO1xuICAgIHBvcnQ/OiBudW1iZXI7XG59XG5cbi8vIEFXUyBDb25maWd1cmF0aW9uXG5jb25zdCBzZWNyZXRzTWFuYWdlciA9IG5ldyBTZWNyZXRzTWFuYWdlckNsaWVudCh7IHJlZ2lvbjogXCJhZi1zb3V0aC0xXCIgfSk7XG5jb25zdCBzM0NsaWVudCA9IG5ldyBTM0NsaWVudCh7IHJlZ2lvbjogXCJhZi1zb3V0aC0xXCIgfSk7XG5jb25zdCBzZWNyZXROYW1lID0gXCJsbXNQcm9kdWN0aW9uXCI7XG5jb25zdCBTM19CVUNLRVRfTkFNRSA9IHByb2Nlc3MuZW52LlMzX0JVQ0tFVF9OQU1FIHx8IFwibG1zLXNpY2stbm90ZXMtYnVja2V0XCI7XG5cbi8vIERhdGFiYXNlIENvbm5lY3Rpb24gJiB1dGlsaXRpZXNcbmNsYXNzIERhdGFiYXNlU2VydmljZSB7XG4gICAgcHJpdmF0ZSBzdGF0aWMgYXN5bmMgZ2V0RGF0YWJhc2VDcmVkZW50aWFscygpOiBQcm9taXNlPERhdGFiYXNlQ3JlZGVudGlhbHM+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGlucHV0ID0geyBTZWNyZXRJZDogXCJsbXNQcm9kdWN0aW9uXCIgfTtcbiAgICAgICAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgR2V0U2VjcmV0VmFsdWVDb21tYW5kKGlucHV0KTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgc2VjcmV0c01hbmFnZXJDbGllbnQuc2VuZChjb21tYW5kKTtcblxuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5TZWNyZXRTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWNyZXQgc3RyaW5nIGlzIGVtcHR5XCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBzZWNyZXRTdHJpbmcgPSBKU09OLnBhcnNlKHJlc3BvbnNlLlNlY3JldFN0cmluZyk7XG4gICAgICAgICAgICBjb25zdCB7IHVzZXJuYW1lLCBwYXNzd29yZCwgaG9zdCwgcG9ydCB9ID0gc2VjcmV0U3RyaW5nO1xuXG4gICAgICAgICAgICBpZiAoIXVzZXJuYW1lIHx8ICFwYXNzd29yZCB8fCAhaG9zdCB8fCAhcG9ydCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1pc3NpbmcgcmVxdWlyZWQgZGF0YWJhc2UgY3JlZGVudGlhbHNcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7IHVzZXJuYW1lLCBwYXNzd29yZCwgaG9zdCwgcG9ydCB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIHJldHJpZXZpbmcgZGF0YWJhc2UgY3JlZGVudGlhbHM6XCIsIGVycm9yKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGFzeW5jIGNyZWF0ZUNvbm5lY3Rpb24oKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB7IHVzZXJuYW1lLCBwYXNzd29yZCwgaG9zdCwgcG9ydCB9ID0gYXdhaXQgdGhpcy5nZXREYXRhYmFzZUNyZWRlbnRpYWxzKCk7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgbXlzcWwuY3JlYXRlQ29ubmVjdGlvbih7XG4gICAgICAgICAgICAgICAgaG9zdCxcbiAgICAgICAgICAgICAgICBwb3J0LFxuICAgICAgICAgICAgICAgIHVzZXI6IHVzZXJuYW1lLFxuICAgICAgICAgICAgICAgIHBhc3N3b3JkLFxuICAgICAgICAgICAgICAgIGRhdGFiYXNlOiBcImxtc19kYlwiLFxuICAgICAgICAgICAgICAgIHNzbDogJ0FtYXpvbiBSRFMnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBjcmVhdGluZyBkYXRhYmFzZSBjb25uZWN0aW9uOlwiLCBlcnJvcik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHsgRGF0YWJhc2VTZXJ2aWNlIH07XG5cbiJdfQ==