import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { Request } from 'express';
import axios from 'axios';
import { RoutesService } from 'src/routes/routes.service';
import { TraccarService } from 'src/traccar/traccar.service';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Positions } from 'src/libs/databases/position.entity';
import { PositionType } from 'src/types/positionType';
import { Device } from './entity/device.entity';


@Injectable()
export class DevicesService {
    constructor(private readonly authService: AuthService,
        private readonly routesService: RoutesService,
        @Inject(forwardRef(() => TraccarService))
        private readonly traccarService: TraccarService,
        @InjectRepository(Device) private readonly deviceRepository: Repository<Device>,
        @InjectRepository(Positions) private readonly positionsRepository: Repository<Positions>
    ) { }
    private readonly traccarApiUrl = process.env.My_Ip;
    private readonly traccarUser = process.env.TRACCAR_USER;
    private readonly traccarPass = process.env.TRACCAR_PASS;
    private readonly monitorUser = process.env.TRACCAR_MONITOR_USER;
    private readonly monitorPass = process.env.TRACCAR_MONITOR_PASS;

    private buildAuthHeaders(email: string, password: string) {
        return {
            Authorization: this.authService.authHeader(email, password),
            'Content-Type': 'application/json',
        };
    }

    async findDeviceById(deviceId: number) {
        try {
            const headers = this.buildAuthHeaders(this.traccarUser!, this.traccarPass!);

            // Obtener todos los dispositivos del usuario autenticado
            const response = await axios.get(`${this.traccarApiUrl}/devices`, { headers });

            // Buscar el dispositivo con el ID solicitado
            const device = response.data.find((d: any) => d.id === deviceId);

            if (!device) {
                throw new HttpException(`No se encontró el dispositivo con ID ${deviceId}`, HttpStatus.NOT_FOUND);
            }

            return device;
        } catch (error) {
            console.error(`Error buscando dispositivo con ID ${deviceId}:`, error);
        }
    }

    async sincronizeDevicesToAduana(aduanaId: number, aduanaUser: string, aduanaPass: string) {
        const headers = this.buildAuthHeaders(this.monitorUser!, this.monitorPass!);
        const aduanaHeaders = this.buildAuthHeaders(aduanaUser, aduanaPass);

        try {
            // 1️⃣ Obtener dispositivos del monitor y aduana
            const [deviceRes, aduanaDeviceRes] = await Promise.all([
                axios.get(`${this.traccarApiUrl}/devices`, { headers }),
                axios.get(`${this.traccarApiUrl}/devices`, { headers: aduanaHeaders })
            ]);
            const devices = deviceRes.data;
            const aduanaDevices = aduanaDeviceRes.data;

            const monitorDeviceIds = new Set(devices.map((d: any) => d.id));
            const aduanaDeviceIds = new Set(aduanaDevices.map((d: any) => d.id));

            const noAsignadosDispositivos = devices.filter((d: any) => !aduanaDeviceIds.has(d.id));
            const yaAsignadosDispositivos = aduanaDevices.filter((d: any) => !monitorDeviceIds.has(d.id));

            await Promise.all(
                noAsignadosDispositivos.map((d: any) =>
                    axios.post(`${this.traccarApiUrl}/permissions`, {
                        userId: aduanaId,
                        deviceId: d.id
                    }, { headers })
                )
            );

            await Promise.all(
                yaAsignadosDispositivos.map((d: any) =>
                    axios.delete(`${this.traccarApiUrl}/permissions`, {
                        headers,
                        data: {
                            userId: aduanaId,
                            deviceId: d.id
                        }
                    })
                )
            );

            // 2️⃣ Obtener conductores del monitor y aduana
            const [driverRes, aduanaDriverRes] = await Promise.all([
                axios.get(`${this.traccarApiUrl}/drivers`, { headers }),
                axios.get(`${this.traccarApiUrl}/drivers`, { headers: aduanaHeaders })
            ]);
            const drivers = driverRes.data;
            const aduanaDrivers = aduanaDriverRes.data;

            const monitorDriverIds = new Set(drivers.map((d: any) => d.id));
            const aduanaDriverIds = new Set(aduanaDrivers.map((d: any) => d.id));

            const noAsignadosConductores = drivers.filter((d: any) => !aduanaDriverIds.has(d.id));
            const yaAsignadosConductores = aduanaDrivers.filter((d: any) => !monitorDriverIds.has(d.id));

            await Promise.all(
                noAsignadosConductores.map((d: any) =>
                    axios.post(`${this.traccarApiUrl}/permissions`, {
                        userId: aduanaId,
                        driverId: d.id
                    }, { headers })
                )
            );

            await Promise.all(
                yaAsignadosConductores.map((d: any) =>
                    axios.delete(`${this.traccarApiUrl}/permissions`, {
                        headers,
                        data: {
                            userId: aduanaId,
                            driverId: d.id
                        }
                    })
                )
            );

            return {
                dispositivosAgregados: noAsignadosDispositivos.map((d: any) => d.name),
                dispositivosEliminados: yaAsignadosDispositivos.map((d: any) => d.name),
                conductoresAgregados: noAsignadosConductores.map((d: any) => d.name),
                conductoresEliminados: yaAsignadosConductores.map((d: any) => d.name),
            };

        } catch (error) {
            console.error('Error al sincronizar dispositivos o conductores con aduana:', error);
            throw new HttpException('Error sincronizando con aduana', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async sincronizeDeviceToDB() {
        const devices = await this.getAllDevices();

        const savedDevices: Device[] = [];
        for (const device of devices) {
            const newDevice = this.deviceRepository.create({
                idDevice: device.id,
                name: device.name,
                phone: device.phone,
                uniqueId: device.uniqueId
            })
            savedDevices.push(newDevice);
        }
        await this.deviceRepository.save(savedDevices);
    }

    async getDevicesFromTraccar(req: Request) {
        const userData = this.authService.getDataFromCookie(req);
        if (!userData) {
            throw new HttpException('No session active', HttpStatus.UNAUTHORIZED);
        }
        try {
            const { emailUser, passwordUser, idUser } = userData;
            if (emailUser == 'l.lara@aduanas.gob.do') {
                try {
                    this.sincronizeDevicesToAduana(idUser, emailUser, passwordUser)
                } catch (error) {
                    throw new HttpException('Error asignando los dispositos al usuario aduana', HttpStatus.BAD_REQUEST)
                }
            }
            const headers = this.buildAuthHeaders(emailUser, passwordUser);

            // Realizar la solicitud GET a la API de Traccar para obtener los dispositivos
            const response = await axios.get(`${this.traccarApiUrl}/devices`, { headers });
            return response.data;
        } catch (error) {
            console.log('Error fetching devices from Traccar:', error);
        }
    }

    async getAllDevicesFromBD(req: Request) {
        const userData = this.authService.getDataFromCookie(req);
        if (!userData) {
            throw new HttpException('No session active', HttpStatus.UNAUTHORIZED);
        }
        return await this.deviceRepository.find();
    }

async getDeviceByIdFromBD(req: Request, deviceId: number) {
        const userData = this.authService.getDataFromCookie(req);
        if (!userData) {
            throw new HttpException('No session active', HttpStatus.UNAUTHORIZED);
        }
        const device = await this.deviceRepository.findOne({ where: { idDevice: deviceId } });
        if (!device) {
            throw new HttpException(`No se encontró el dispositivo con ID ${deviceId} en la base de datos`, HttpStatus.NOT_FOUND);
        }
        return device;
    }

    async getDeviceByUserIdFromBD(req: Request) {
        const userData = this.authService.getDataFromCookie(req);
        if (!userData) {
            throw new HttpException('No session active', HttpStatus.UNAUTHORIZED);
        }
        const { idUser } = userData;
        return await this.deviceRepository.find({ where: { idUser } });
    }

    async getDriversFromTraccar(req: Request) {
        const userData = this.authService.getDataFromCookie(req);
        if (!userData) {
            throw new HttpException('No session active', HttpStatus.UNAUTHORIZED);
        }
        try {
            const { emailUser, passwordUser } = userData;
            const headers = this.buildAuthHeaders(emailUser, passwordUser);

            // Realizar la solicitud GET a la API de Traccar para obtener los conductores
            const response = await axios.get(`${this.traccarApiUrl}/drivers`, { headers });
            return response.data;
        } catch (error) {
            console.log('Error fetching drivers from Traccar:', error);
        }
    }

    async getDeviceDriver(req: Request) {
        const userData = this.authService.getDataFromCookie(req);
        if (!userData) {
            throw new HttpException('No session active', HttpStatus.UNAUTHORIZED);
        }

        try {
            const { emailUser, passwordUser } = userData;
            const headers = this.buildAuthHeaders(emailUser, passwordUser);

            const devices = await this.getDevicesFromTraccar(req);

            if (!devices || devices.length === 0) {
                throw new HttpException('No devices found', HttpStatus.NOT_FOUND);
            }

            const deviceIds = devices.map((device: any) => device.id);

            const driverPromises = deviceIds.map(async (id: number) => {
                const res = await axios.get(`${this.traccarApiUrl}/drivers?deviceId=${id}`, { headers });
                return {
                    deviceId: id,
                    drivers: res.data
                };
            });

            const deviceDrivers = await Promise.all(driverPromises);

            return { deviceDrivers };

        } catch (error) {
            console.log('Error fetching device drivers from Traccar:', error);
            throw new HttpException('Error fetching device drivers', HttpStatus.BAD_GATEWAY);
        }
    }

    async getDeviceDriverOpen() {
        try {

            const headers = this.buildAuthHeaders(this.traccarUser!, this.traccarPass!);

            const devices = await this.getAllDevices();

            if (!devices || devices.length === 0) {
                throw new HttpException('No devices found', HttpStatus.NOT_FOUND);
            }

            const deviceIds = devices.map((device: any) => device.id);

            const driverPromises = deviceIds.map(async (id: number) => {
                const res = await axios.get(`${this.traccarApiUrl}/drivers?deviceId=${id}`, { headers });
                return {
                    deviceId: id,
                    drivers: res.data
                };
            });

            const deviceDrivers = await Promise.all(driverPromises);

            return { deviceDrivers };

        } catch (error) {
            console.log('Error fetching device drivers from Traccar:', error);
            throw new HttpException('Error fetching device drivers', HttpStatus.BAD_GATEWAY);
        }
    }

    async getPositionFromTraccar(req: Request) {
        const userData = this.authService.getDataFromCookie(req);
        if (!userData) {
            throw new HttpException('No session active', HttpStatus.UNAUTHORIZED);
        }
        try {
            const { emailUser, passwordUser } = userData;
            const headers = this.buildAuthHeaders(emailUser, passwordUser);
            const response = await axios.get(`${this.traccarApiUrl}/positions`, { headers });
            return response.data;
        } catch (error) {
            console.log('Error fetching devices from Traccar:', error);
        }
    }

    async findDriversByName(req: Request, name: string) {
        const userData = this.authService.getDataFromCookie(req);
        if (!userData) {
            throw new HttpException('No session active', HttpStatus.UNAUTHORIZED);
        }

        try {
            // Obtener todos los conductores del usuario
            const drivers = await this.getDriversFromTraccar(req);

            // Filtrar por nombre (ignora mayúsculas/minúsculas)
            const matchingDrivers = drivers.filter((driver: any) =>
                driver.name.toLowerCase().includes(name.toLowerCase())
            );

            return { matchingDrivers };
        } catch (error) {
            console.error('Error finding drivers by name:', error);
            throw new HttpException('Error finding drivers', HttpStatus.BAD_GATEWAY);
        }
    }

    async findDevicesByName(req: Request, name: string) {
        const userData = this.authService.getDataFromCookie(req);
        if (!userData) {
            throw new HttpException('No session active', HttpStatus.UNAUTHORIZED);
        }

        try {
            // Obtener todos los dispositivos del usuario
            const devices = await this.getDevicesFromTraccar(req);

            // Filtrar por nombre
            const matchingDevices = devices.filter((device: any) =>
                device.name.toLowerCase().includes(name.toLowerCase())
            );

            return { matchingDevices };
        } catch (error) {
            console.error('Error finding devices by name:', error);
            throw new HttpException('Error finding devices', HttpStatus.BAD_GATEWAY);
        }
    }

    async getAllDrivers() {
        try {
            const headers = this.buildAuthHeaders(this.traccarUser!, this.traccarPass!)
            const response = await axios.get(`${this.traccarApiUrl}/drivers`, { headers });
            return response.data;
        } catch (error) {
            throw new HttpException('Error obteniendo todos los conductores', HttpStatus.UNAUTHORIZED);
        }
    }

    async getAllDevices() {
        try {
            const headers = this.buildAuthHeaders(this.traccarUser!, this.traccarPass!)
            const response = await axios.get(`${this.traccarApiUrl}/devices`, { headers });
            return response.data;
        } catch (error) {
            throw new HttpException('Error obteniendo todos los dispositivos', HttpStatus.UNAUTHORIZED);
        }
    }

    async getDifferentDevices(req: Request) {
        const userData = this.authService.getDataFromCookie(req)
        if (!userData) {
            throw new HttpException('Error, no estas autenticado', HttpStatus.UNAUTHORIZED)
        }
        try {

            // 1️⃣ Traer dispositivos del usuario autenticado
            const userDevices = await this.getDevicesFromTraccar(req);
            // 2️⃣ Traer todos los dispositivos admin
            const allDevices = await this.getAllDevices();
            // 3️⃣ Comparar: dejar solo los que estén en admin pero no en usuario
            const userDeviceIds = new Set(userDevices.map((d: any) => d.id));
            const differentDevices = allDevices.filter(
                (device: any) => !userDeviceIds.has(device.id)
            );
            return { differentDevices };
        } catch (error) {
            console.error('Error fetching different devices:', error);
            throw new HttpException('Error fetching different devices', HttpStatus.BAD_GATEWAY);
        }
    }

    async getDifferentDrivers(req: Request) {
        const userData = this.authService.getDataFromCookie(req)
        if (!userData) {
            throw new HttpException('Error, no estas autenticado', HttpStatus.UNAUTHORIZED)
        }
        try {
            // Traer conductores de traccar
            const userDrivers = await this.getDriversFromTraccar(req)
            // Traer todos los conductores de admin
            const adminDrivers = await this.getAllDrivers();
            // Comparar: dejar solo los que estén en admin pero no en usuario
            const userDriversIds = new Set(userDrivers.map((d: any) => d.id));
            const differentDrivers = adminDrivers.filter((drivers: any) => !userDriversIds.has(drivers.any))
            return { differentDrivers };
        } catch (error) {
            console.error('Error fetching different drivers:', error);
            throw new HttpException('Error fetching different drivers', HttpStatus.BAD_GATEWAY);
        }
    }

    async asignDeviceToUser(req: Request, deviceId: number) {
        const userData = this.authService.getDataFromCookie(req)
        const { idUser, emailUser, passwordUser } = userData;
        try {
            const headers = this.buildAuthHeaders(emailUser, passwordUser);
            await this.updateDeviceToUserDB(req, deviceId);
            return await axios.post(
                `${this.traccarApiUrl}/permissions`,
                {
                    userId: idUser,
                    deviceId: deviceId,
                },
                { headers },
            );
        } catch (error) {
            throw new HttpException('Error asignando dispositivo', HttpStatus.CONFLICT)
        }
    }

    async updateDeviceToUserDB(req: Request, deviceId: number) {
        const userData = this.authService.getDataFromCookie(req)
        const { idUser, emailUser, passwordUser, admin } = userData;
        if (!admin) {
            throw new HttpException('Error, no estás autorizado para esto', HttpStatus.UNAUTHORIZED);
        }
        try {
            const device = await this.deviceRepository.findOne({ where: { idDevice: deviceId } });
            if (!device) {
                throw new HttpException(`No se encontró el dispositivo con ID ${deviceId} en la base de datos`, HttpStatus.NOT_FOUND);
            }
            device.idUser = idUser;
            await this.deviceRepository.save(device);
        } catch (error) {
            throw new HttpException('Error asignando dispositivo', HttpStatus.CONFLICT)
        }
    }

    async asignDriverToUser(req: Request, driverId: number) {
        const userData = this.authService.getDataFromCookie(req)
        const { idUser, emailUser, passwordUser } = userData;
        try {
            const headers = this.buildAuthHeaders(emailUser, passwordUser);
            await axios.post(
                `${this.traccarApiUrl}/permissions`,
                {
                    userId: idUser,
                    driverId: driverId,
                },
                { headers },
            );
        } catch (error) {
            throw new HttpException('Error asignando dispositivo', HttpStatus.CONFLICT)
        }

    }

    async asignDriverToDevice(req: Request, driverName: string, deviceName: string) {
        const userData = this.authService.getDataFromCookie(req);
        if (!userData) {
            throw new HttpException('Error, no estás autenticado', HttpStatus.UNAUTHORIZED);
        }

        const { admin } = userData;

        if (!admin) {
            throw new HttpException('Error, no estás autorizado para esto', HttpStatus.UNAUTHORIZED);
        }

        try {
            const { matchingDrivers } = await this.findDriversByName(req, driverName);
            const { matchingDevices } = await this.findDevicesByName(req, deviceName);

            if (matchingDrivers.length === 0) {
                throw new HttpException(`No se encontró el conductor ${driverName}`, HttpStatus.NOT_FOUND);
            }

            if (matchingDevices.length === 0) {
                throw new HttpException(`No se encontró el dispositivo ${deviceName}`, HttpStatus.NOT_FOUND);
            }

            // Tomar el primer match (o puedes validar múltiples si quieres)
            const driverIdNumber = matchingDrivers[0].id;
            const deviceIdNumber = matchingDevices[0].id;

            // Headers con credenciales admin para permisos
            const headers = this.buildAuthHeaders(this.traccarUser!, this.traccarPass!);

            // ✅ Verificar si el dispositivo ya tiene conductor asignado
            const permissionResponse = await axios.get(
                `${this.traccarApiUrl}/drivers?deviceId=${deviceIdNumber}`,
                { headers },
            );

            const permissions = permissionResponse.data;

            if (permissions && permissions.length > 0) {
                for (const assignedDriver of permissions) {
                    await axios.delete(`${this.traccarApiUrl}/permissions`, {
                        headers,
                        data: {
                            deviceId: deviceIdNumber,
                            driverId: assignedDriver.id,
                        },
                    });
                }
                console.log(`Conductores previos eliminados para el dispositivo ${deviceName}`);
            }

            // ✅ Asignar el nuevo conductor
            await axios.post(
                `${this.traccarApiUrl}/permissions`,
                {
                    deviceId: deviceIdNumber,
                    driverId: driverIdNumber,
                },
                { headers },
            );

            console.log(`Conductor ${driverName} asignado correctamente a ${deviceName}`);

            return {
                message: `Conductor ${driverName} asignado correctamente al dispositivo ${deviceName}`,
            };
        } catch (error) {
            console.error('Error asignando conductor:', error);
            throw new HttpException('Error asignando conductor', HttpStatus.BAD_GATEWAY);
        }
    }

    async openDeviceByCommand(req: Request, deviceName: string) {
        const userData = this.authService.getDataFromCookie(req);
        if (!userData) {
            throw new HttpException('Error, no estás autenticado', HttpStatus.UNAUTHORIZED);

        }

        try {
            const route = await this.routesService.findRouteByDeviceName(deviceName)

            const { matchingDevices } = await this.findDevicesByName(req, deviceName);
            if (matchingDevices.length === 0) {
                throw new HttpException(`No se encontró el dispositivo ${deviceName}`, HttpStatus.NOT_FOUND);
            }

            const deviceIdNumber = matchingDevices[0].id;
            const headers = this.buildAuthHeaders(this.traccarUser!, this.traccarPass!);

            const commandIdNumber = 1;

            // Crear la relación permission
            await axios.post(
                `${this.traccarApiUrl}/permissions`,
                {
                    deviceId: deviceIdNumber,
                    commandId: commandIdNumber,
                },
                { headers },
            );

            // Enviar el comando
            await axios.post(
                `${this.traccarApiUrl}/commands/send`,
                {
                    deviceId: deviceIdNumber,
                    id: commandIdNumber,
                },
                { headers },
            );

            if (route) {
                await this.routesService.deleteRouteByDeviceName(deviceName);
                return {
                    message: `Comando enviado correctamente al dispositivo, ruta finalizada correctamente ${deviceName}`,
                };
            }
            return {
                    message: `Comando enviado correctamente al dispositivo ${deviceName}`,
                };

        } catch (error) {
            console.error('Error enviando comando al dispositivo:', error);
            throw new HttpException('Error enviando comando al dispositivo', HttpStatus.BAD_GATEWAY);
        }
    }

    async createPosition(positionData: PositionType) {
        const deviceData = await this.findDeviceById(positionData.deviceId);
        if (!deviceData) return;
        const routeData = await this.routesService.findRouteByDeviceName(deviceData.name)
        if (!routeData) return;
        const position: Partial<Positions> = {
            idPosition: positionData.idPosition,
            deviceId: positionData.deviceId,
            latitude: positionData.latitude,
            longitude: positionData.longitude,
            speed: positionData.speed!,
            course: positionData.course!,
            accuracy: positionData.accuracy!,
            batteryPercentage: positionData.batteryPercentage!,
            deviceTime: positionData.deviceTime!,
            serverTime: positionData.serverTime!,
            satellites: positionData.satellites!,
            blocked: false,
        };

        const newPosition = this.positionsRepository.create(position);
        await this.positionsRepository.save(newPosition);
        console.log("Se logro insertar el location");
        return newPosition;
    }

    async asignUserToDevice(req: Request, deviceName: string, userId: number) {
        const userData = this.authService.getDataFromCookie(req);
        if (!userData) {
            throw new HttpException('Error, no estás autenticado', HttpStatus.UNAUTHORIZED);
        }
        const { admin } = userData;
        if (!admin) {
            throw new HttpException('Error, no estás autorizado para esto', HttpStatus.UNAUTHORIZED);
        }
        try {
            const device = await this.deviceRepository.findOne({where: {name: deviceName}});
            if (!device) {
                throw new HttpException(`No se encontró el dispositivo con nombre ${deviceName} en la base de datos`, HttpStatus.NOT_FOUND);
            }
            device.idUser = userId;
            await this.deviceRepository.save(device);
            return {
                message: `Usuario asignado correctamente al dispositivo ${deviceName}`,
            };
        } catch (error) {
            throw new HttpException('Error asignando usuario al dispositivo', HttpStatus.BAD_GATEWAY);
        }
    }

    

}