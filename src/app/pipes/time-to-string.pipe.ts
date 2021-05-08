import { Pipe, PipeTransform } from "@angular/core";
import { ScheduleConverter } from "@app/treatment-schedule/treatment-schedule-converter";
import { Moment } from "moment";

@Pipe({name:'time2string'})
export class TimeToStringPipe implements PipeTransform {
    transform(value: Moment) {
        return  ScheduleConverter.getScheduledTime(value);
    }
}