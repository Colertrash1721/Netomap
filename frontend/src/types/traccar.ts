export type AssignedDriver = {
    drivers: [
        {
            id?: number;
            name?: string;
        }
    ]
    deviceId?: number;
}

export type Device = {
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

export type Drivers = {
    id?: number,
    name?: string,
}
