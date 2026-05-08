
import { RowDataPacket, OkPacket } from 'mysql2';

export interface DocumentCategoryRow extends RowDataPacket {
    id: number;
    name: string;
    description: string;
    color: string;
    document_count: number;
}
