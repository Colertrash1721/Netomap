export type Device = {
    idDevice: any;
    id?: number;
    positionId?: number;
    name?: string;
    attributes?: {
        portador?: string
        attributes?: {
            Empresa?: string
            Unidad?: string
            Puerto?: string
            Destino?: string
        }
    };
    status?: string;
}

export type Drivers = {
    id?: number;
    name?: string;
}

export type Position = {
    id?: number;
    deviceId?: number;
    latitude?: number;
    longitude?: number;
    attributes?: {
        batteryLevel?: number;
        alarm?: string;
    }
}

export type Event = {
    id?: number,
    attributes?: {
        alarm?: string;
        message?: string;
    }
    deviceId?: number;
}
