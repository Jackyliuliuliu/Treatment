import { Pipe, PipeTransform } from "@angular/core";

@Pipe({name:'bool2active'})
export class BoolToAvtivePipe implements PipeTransform {
    transform(value: boolean | undefined) {
        if (value === true)
        {
            return "Active";
        }
        if (value === false)
        {
            return "InActive"
        }

        return "";
    }
}