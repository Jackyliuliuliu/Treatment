import { Moment } from 'moment';
import { Injector } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd';
import { AppComponentBase } from '@shared/app-component-base';
import { NumberValueAccessor } from '@angular/forms/src/directives';
import { TechniqueType } from '@shared/service-proxies/service-proxies';

export class ScheduleConverter extends AppComponentBase{

    strWeek: string = null;
    constructor(
        injector: Injector,
        public msg: NzMessageService) {
        super(injector);
    }
// tslint:disable-next-line: member-ordering
    public static getScheduledDate(jsonDate: Moment) {
        if(jsonDate == null)
        {
            //this.msg.error('[getScheduledDate]: jsonDate is null.');
            return null;
        }
        var year = jsonDate.year();
        var month = jsonDate.month() + 1;
        var day = jsonDate.date();
        var weekday = Number(jsonDate.weekday());
        return year + "/" + month + "/" + day ;
    }


    public static getScheduledDateByDate(date: Date) {
        if(date == null)
        {
            //this.msg.error('[getScheduledDate]: jsonDate is null.');
            return null;
        }
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();

        return year + '-' + month + '-' + day;
    }

// tslint:disable-next-line: member-ordering
    public static getScheduledTime(jsonDate: Moment) {
        if(jsonDate == null)
        {
            //this.msg.error('[getScheduledTime]: jsonDate is null.');
            return null;
        }
        var hour = jsonDate.hour();
        var min = jsonDate.minute();
        let minStr: string;
        if (min < 10) {
            minStr = '0'+ min  ;
        } else {
            minStr = min + '';
        }
        return hour + ':' + minStr;
    }

// tslint:disable-next-line: member-ordering
    public static getDateFromString(strDate: string): Date {
// tslint:disable-next-line: triple-equals
        if(strDate == null || strDate == undefined)
        {
            return null;
        }
        
        var strArray: string[] = strDate.split('-');

        var yearNum: number = parseInt(strArray[0], 10);
        var monthNum: number = parseInt(strArray[1], 10) - 1;
        var dayNum: number = parseInt(strArray[2], 10) + 1;

        var date:Date = new Date(yearNum, monthNum, dayNum, -16, 0, 0);
        
        return date;
        // return strArray;
    }

    public static getDateFromStringByDate(strDate: string, days: number, actionStatus: string): Date {
        // tslint:disable-next-line: triple-equals
                if(strDate == null || strDate == undefined)
                {
                    return null;
                }
                
                var strArray: string[] = strDate.split('-');
        
                var yearNum: number = parseInt(strArray[0], 10);
                var monthNum: number = parseInt(strArray[1], 10) - 1;
                switch(actionStatus)
                {
                    case 'Delay': 
                        var dayNum: number = parseInt(strArray[2], 10) + 1 + days;
                    break;

                    case 'Ahead':
                    var dayNum: number = parseInt(strArray[2], 10) + 1 - days; 
                }
                
        
                var date:Date = new Date(yearNum, monthNum, dayNum, -16, 0, 0);
                
                return date;
                // return strArray;
            }

// tslint:disable-next-line: member-ordering
    public static getTimeFromString(strTime: string, strDate: string): Date {
        if(strDate == null || strDate == undefined || strTime == null || strTime == undefined)
        {
            return null;
        }
        var strDateArray: string[] = strDate.split('-');

        var yearNum: number = parseInt(strDateArray[0], 10);
        var monthNum: number = parseInt(strDateArray[1], 10) - 1;
        var dayNum: number = parseInt(strDateArray[2], 10) + 1;

        var strTimeArray: string[] = strTime.split(':');

        var hourNum: number = parseInt(strTimeArray[0], 10) - 16;
        var minuteNum: number = parseInt(strTimeArray[1], 10);

        var date: Date = new Date(yearNum, monthNum, dayNum, hourNum, minuteNum, 0);

        return date;
    } 

    public static getTimeFromStringByHourAndMin(strDate: string, strTime: string, hours: number, minutes: number,action:string): Date
    {
         if(strDate == null || strDate == undefined || strTime == null || strTime == undefined)
        {
            return null;
        }
        var strDateArray: string[] = strDate.split('-');

        var yearNum: number = parseInt(strDateArray[0], 10);
        var monthNum: number = parseInt(strDateArray[1], 10) - 1;
        var dayNum: number = parseInt(strDateArray[2], 10) + 1;

        // var strTimeArray: string[] = strTime.split(':');

        // var hourNum: number = parseInt(strTimeArray[0], 10) - 16;
        // var minuteNum: number = parseInt(strTimeArray[1], 10);
        var strTimeArray: string[] = strTime.split(':');
        if(action=="Delay"){
            var hourNum: number = hours + parseInt(strTimeArray[0], 10) - 16;
            var minuteNum: number = minutes + parseInt(strTimeArray[1], 10);
        }
        if(action == "Ahead"){
            var hourNum: number =  parseInt(strTimeArray[0], 10) - 16 -hours;
            var minuteNum: number = parseInt(strTimeArray[1], 10) - minutes;
        }

        var date: Date = new Date(yearNum, monthNum, dayNum, hourNum, minuteNum, 0);

        return date;
    }

    public static getBeamsNameStr(beams: TechniqueType): string {
        var strBeamsName = String(beams.name);
        return strBeamsName;
    }

    public static convertIsActive(isActive: string): boolean {
        if(isActive == "Active")
        {
            return true;
        }
        else{
            return false;
        }
    }

    public static convertNullBeamGroupName(beamGroupName: string): string {
        if(beamGroupName == null)
        {
            return "null";
        }
        else{
            return beamGroupName;
        }
    }
}