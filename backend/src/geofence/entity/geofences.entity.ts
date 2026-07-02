import {Entity, Column, PrimaryGeneratedColumn} from 'typeorm';

@Entity('geofences')
export class Geofences {
    @PrimaryGeneratedColumn()
    idGeofence: number;

    @Column({ length: 100, type: 'varchar' })
    name: string;

    @Column({ type: 'json' })
    geometry: any;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    creationDate: Date;

    @Column({ type: 'varchar', length: 100 })
    type: string;
}