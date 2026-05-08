
export interface ApiResponse<T> {
    code: string;
    message: string;
    error: boolean;
    payload: T | null;
}

export class ResponseService {
    static success<T>(message: string, payload: T, statusCode: number = 200): ApiResponse<T> {
        return {
            code: "SUCCESS",
            message,
            error: false,
            payload
        };
    }

    static error(code: string, message: string, payload: any = null): ApiResponse<null> {
        return {
            code,
            message,
            error: true,
            payload
        };
    }
}
