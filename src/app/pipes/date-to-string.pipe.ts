import { Pipe, PipeTransform } from "@angular/core";
import { ScheduleConverter } from "@app/treatment-schedule/treatment-schedule-converter";
import { Moment } from "moment";

@Pipe({name:'data2string'})
export class DateToStringPipe implements PipeTransform {
    transform(value: Moment) {
        return  ScheduleConverter.getScheduledDate(value);
    }
}