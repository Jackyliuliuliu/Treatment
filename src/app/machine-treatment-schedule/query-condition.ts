import * as moment from 'moment';

export class QueryCondition {
    sessionDateRange: any = [];
    machineName : string | undefined;
    patientName : string | undefined;
    patientId : string | undefined;
    sessionStatus:  {id:number, name:string} | undefined;
}