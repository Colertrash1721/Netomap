import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";


@Entity("devicepositions")
export class Positions {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number;

  @Column({ name: "idPosition", type: "int" })
  idPosition: number;

  @Column({ name: "deviceId", type: "int" })
  deviceId: number;

  @Column({ name: "latitude", length: 50 })
  latitude: string;

  @Column({ name: "longitude", length: 50 })
  longitude: string;

  @Column({ name: "speed", type: "float", nullable: true })
  speed: number;

  @Column({ name: "batteryPercentage", type: "int", nullable: true })
  batteryPercentage: number;

  @Column({ name: "course", type: "int", nullable: true })
  course: number;

  @Column({ name: "serverTime", type: "timestamp", nullable: true })
  serverTime: Date;

  @Column({ name: "deviceTime", type: "timestamp", nullable: true })
  deviceTime: Date;

  @Column({ name: "accuracy", type: "int", nullable: true })
  accuracy: number;

  @Column({ name: "satellites", type: "int", nullable: true })
  satellites: number;

  @Column({ name: "blocked", type: "tinyint", default: false })
  blocked: boolean;

  @Column({ name: "creationDate", type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  creationDate: Date;
}