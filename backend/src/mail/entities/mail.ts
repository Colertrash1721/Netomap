import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('mail')
export class Mail {
    // Define columns and relationships here as needed
    @PrimaryGeneratedColumn()
    idMail: number;

    @Column({ type: 'varchar', length: 255, unique: true })
    name: string;
    
    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

}