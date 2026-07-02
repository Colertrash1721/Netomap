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

    @Column({ type: 'varchar', length: 20 })
    phone: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    licenseNumber: string;

    @Column({ type: 'varchar', length: 100 })
    email: string;

    @OneToMany(() => Routes, route => route.idDriver)
    routes: Routes;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    creationDate: Date;

    @Column({ type: 'int', default: 1 })
    userId: number;
}