import { Routes } from 'src/routes/entities/route.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('drivers')
export class Drivers {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 100 })
    documentId: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @OneToMany(() => Routes, route => route.idDriver)
    routes: Routes;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    creationDate: Date;
}