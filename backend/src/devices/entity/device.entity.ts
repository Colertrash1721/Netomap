import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("devices")
export class Device {
    @PrimaryColumn()
    idDevice: number;

    @Column({ length: 100 })
    name: string;

    @Column({ length: 50, nullable: true })
    uniqueId: string;

    @Column({ length: 50, nullable: true })
    phone: string;

    @Column( { type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    creationDate: Date;

    @Column({ type: 'int', nullable: true })
    idUser: number;
}