import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'dateAgo',
    pure: true,
})
export class DateAgoPipe implements PipeTransform {
    transform(value: any, args?: any): any {
        if (value) {
            const seconds = Math.floor((+new Date() - +new Date(value)) / 1000);
            if (seconds < 29)
                return 'In diesem Moment';
            const intervals = {
                'Jahr': 31536000,
                'Monat': 2592000,
                'Woche': 604800,
                'Tag': 86400,
                'Stunde': 3600,
                'Minute': 60,
                'Sekunde': 1,
            };
            let counter;
            // tslint:disable-next-line:forin
            for (const i in intervals) {
                counter = Math.floor(seconds / intervals[i]);
                if (counter > 0)
                    if (counter === 1) {
                        return `vor ${counter} ${i}`; // singular (1 day ago)
                    } else if (['Jahr', 'Monat', 'Tag'].includes(i)) {
                        return `vor ${counter} ${i}en`; // plural (2 days ago)
                    } else {
                        return `vor ${counter} ${i}n`; // plural (2 days ago)
                    }
            }
        }
        return value;
    }
}
