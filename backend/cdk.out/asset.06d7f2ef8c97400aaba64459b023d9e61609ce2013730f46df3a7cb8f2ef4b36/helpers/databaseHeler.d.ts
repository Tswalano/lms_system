import mysql from 'mysql2/promise';
export interface DBSecret {
    host: string;
    username: string;
    password: string;
    port?: number;
}
declare class DatabaseService {
    private static getDatabaseCredentials;
    static createConnection(): Promise<mysql.Connection>;
}
export { DatabaseService };
