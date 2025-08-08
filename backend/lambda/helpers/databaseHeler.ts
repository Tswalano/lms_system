import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { S3Client } from "@aws-sdk/client-s3";
import mysql from 'mysql2/promise';

// Clients
const secretsManagerClient = new SecretsManagerClient({});

// Interfaces
interface DatabaseCredentials {
    username: string;
    password: string;
    host: string;
    port: number;
    dbname: string;
}

export interface DBSecret {
    host: string;
    username: string;
    password: string;
    dbname: string;
    port?: number;
}

// AWS Configuration
const secretsManager = new SecretsManagerClient({ region: "af-south-1" });
const s3Client = new S3Client({ region: "af-south-1" });
const SECRET_NAME = process.env.SECRET_NAME || 'lmsDevelopment'; // TODO - make this dynamic based on environment
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "lms-sick-notes-bucket";
const DATABASE_NAME = process.env.DATABASE_NAME || 'lms_db'; // TODO: make this dynamic based on environment


// Database Connection & utilities
class DatabaseService {
    private static async getDatabaseCredentials(): Promise<DatabaseCredentials> {
        try {
            const input = { SecretId: SECRET_NAME };
            const command = new GetSecretValueCommand(input);
            const response = await secretsManagerClient.send(command);

            if (!response.SecretString) {
                throw new Error("Secret string is empty");
            }

            const secretString = JSON.parse(response.SecretString);
            const { username, password, host, port, dbname } = secretString;

            console.log("Database credentials retrieved successfully", SECRET_NAME);
            console.log(`Host: ${host}, Port: ${port}, DB Name: ${dbname}`);

            if (!username || !password || !host || !port || !dbname) {
                throw new Error("Missing required database credentials");
            }

            return { username, password, host, port, dbname };
        } catch (error) {
            console.error("Error retrieving database credentials:", error);
            throw error;
        }
    }

    static async createConnection(): Promise<mysql.Connection> {
        try {
            const { username, password, host, port, dbname } = await this.getDatabaseCredentials();
            return await mysql.createConnection({
                host,
                port,
                user: username,
                password,
                database: dbname,
                ssl: 'Amazon RDS'
            });
        } catch (error) {
            console.error("Error creating database connection:", error);
            throw error;
        }
    }
}

export { DatabaseService };

