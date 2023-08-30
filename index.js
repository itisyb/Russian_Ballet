<script>
var urlParams = new URLSearchParams(window.location.search);

if (urlParams.get('trial') === 'true') {
    var element = document.querySelector('[wized="non_trial_wrapper"]');
    if (element) {
        element.style.display = 'none';
    }
}

window.onload = async () => {
    const breaks = [
        { start: new Date('2023-12-20'), end: new Date('2024-01-02') }, // Winter Break
        { start: new Date('2024-06-26'), end: new Date('2024-07-01') }  // Summer Break
    ];

    const holidays = [
        new Date('2024-02-19'), 
        new Date('2023-10-09'), 
        new Date('2024-03-29'), 
        new Date('2024-05-20'), 
        new Date('2024-07-01'), 
        new Date('2024-08-05'),
        new Date('2023-09-01') 
    ];

    function calculateNumberOfDays(startDate, endDate, availableDays, selectedDays) {
        var count = 0;
        var curDate = new Date(startDate.getTime());
        while (curDate <= endDate) {
            var dayOfWeek = curDate.getDay();
            if (availableDays.includes(dayOfWeek) && selectedDays.includes(dayOfWeek)) {
                count++;
            }
            curDate.setDate(curDate.getDate() + 1);
        }
        console.log(count)
        return count;
    }

    let picker, picker_start;
    let availableDays = [];
    let selectedDays = [];

    const dayMap = {
        'Sunday': 0,
        'Monday': 1,
        'Tuesday': 2,
        'Wednesday': 3,
        'Thursday': 4,
        'Friday': 5,
        'Saturday': 6
    };

    const checkboxes = document.querySelector('[wized="data_option_wrapper"]').querySelectorAll('input');

    const abbreviatedDayMap = {
        'Sun': 0,
        'Mon': 1,
        'Tues': 2,
        'Wed': 3,
        'Thurs': 4,
        'Fri': 5,
        'Sat': 6
    };

    function getDayFromCookie(name) {
        const cookieValue = (document.cookie.match(`(?<=${name}=)[^;]*`) || [])[0];
        return cookieValue ? cookieValue.split(' ')[0] : null;
    }

    Wized.data.listen("r[5].d", async () => {
        setTimeout(async function() {
            const dataStore = await Wized.data.getAll();
            let product = dataStore.r["5"].d.Class_Schedule;
            Wized.data.setCookie("noOfDays", 0)
            Wized.data.setCookie("startdate", "")
            Wized.data.setCookie("enddate", "")
            Wized.data.setCookie("schedule3", null)
            Wized.data.setCookie("trialdate", null)

            if (parseInt(dataStore.r["5"].d.Days_allowed) === product.length) {
                product.forEach(schedule => {
                    const dayNumber = dayMap[schedule.DaysOfWeek];
                    if (!selectedDays.includes(dayNumber)) {
                        selectedDays.push(dayNumber);
                    }
                });
                const selectedSchedule = product.filter(schedule => selectedDays.includes(dayMap[schedule.DaysOfWeek]));
                Wized.data.setCookie("selectedDays", JSON.stringify(selectedSchedule));    
            } else {
                checkboxes.forEach(checkbox => {
                    checkbox.addEventListener('change', function() {
                        const maxChecked = parseInt(dataStore.r["5"].d.Days_allowed);
                        const checkedBoxes = document.querySelector('[wized="data_option_wrapper"]').querySelectorAll('input:checked');
                        
                        if (this.checked && checkedBoxes.length > maxChecked) {
                            this.checked = false; // Uncheck the checkbox
                            alert('You can only select ' + maxChecked + ' options.');
                            return; // Exit the function early
                        }

                        setTimeout(() => {
                            selectedDays = [];
                            checkedBoxes.forEach(checkedBox => {
                                const cookieName = 'wized_' + checkedBox.getAttribute('wized');
                                const dayAbbreviation = getDayFromCookie(cookieName);
                                if (dayAbbreviation) {
                                    const dayNumber = abbreviatedDayMap[dayAbbreviation];
                                    if (!selectedDays.includes(dayNumber)) {
                                        selectedDays.push(dayNumber);
                                    }
                                }
                            });
                            const selectedSchedule = product.filter(schedule => selectedDays.includes(dayMap[schedule.DaysOfWeek]));
                            Wized.data.setCookie("selectedDays", JSON.stringify(selectedSchedule));    
                            
                            if (picker_start) {
                                picker_start.renderAll();
                            }
                        }, 200); // 200ms delay
                    });
                });
            }

            availableDays = product.map(schedule => dayMap[schedule.DaysOfWeek]);

            const dropdown = document.getElementById('end_date');
            picker = new easepick.create({
                element: document.getElementById('datepicker'),
                css: ['https://cdn.jsdelivr.net/npm/@easepick/bundle@1.1.7/dist/index.css'],
                inline: true,
                setup(picker) {
                    picker.ui.container.dataset.theme = 'dark';
                    picker.on('click', (evt) => {
                        const target = evt.target;
                    });
                    picker.on('select', (evt) => {
                        const { date } = evt.detail;
                        Wized.data.setCookie("trialdate", picker.getDate());
                        if (date instanceof Date) {
                            const lockPlugin = picker_start.PluginManager.getInstance('LockPlugin');
                            lockPlugin.options.minDate = date.add(1,'day');
                            picker_start.renderAll();
                        }
                    });
                },
                plugins: ['LockPlugin'],
                LockPlugin: {
                    minDate: new Date().toISOString(),
                    filter(date, picked) {
                        const isAvailableDay = availableDays.includes(date.getDay());
                        const isSelectedDay = selectedDays.includes(date.getDay());
                        const isHoliday = holidays.some(holiday => 
                            holiday.getDate() === date.getDate() &&
                            holiday.getMonth() === date.getMonth() &&
                            holiday.getFullYear() === date.getFullYear()
                        );
                        const isBreak = breaks.some(breakRange => 
                            date >= breakRange.start && date <= breakRange.end
                        );
                        return !(isAvailableDay && isSelectedDay) || isHoliday || isBreak;
                    }
                }
            });

            picker_start = new easepick.create({
                element: document.getElementById('start_date'),
                css: ['https://cdn.jsdelivr.net/npm/@easepick/bundle@1.1.7/dist/index.css'],
                inline: true,
                setup(picker_start) {
                    picker_start.ui.container.dataset.theme = 'dark';
                    picker_start.on('click', (evt) => {
                        const target = evt.target;
                    });
                    picker_start.on('select', (evt) => {
                        const { date } = evt.detail;
                        const endDate = new Date(dropdown.value); 
                        const startDate = picker_start.getDate();
                        const selectedSchedule = product.filter(schedule => selectedDays.includes(dayMap[schedule.DaysOfWeek]));
                        Wized.data.setCookie("selectedDays", JSON.stringify(selectedSchedule));    
                        Wized.data.setCookie("startdate", startDate);
                        Wized.data.setCookie("enddate", endDate);
                        Wized.data.setCookie("noOfDays", calculateNumberOfDays(startDate, endDate, availableDays, selectedDays));
                        if (date instanceof Date) {
                            const lockPlugin = picker.PluginManager.getInstance('LockPlugin');
                            lockPlugin.options.maxDate = date;
                            picker.renderAll();
                        }
                    });
                },
                plugins: ['LockPlugin'],
                LockPlugin: {
                    minDate: new Date().toISOString(),
                    filter(date, picked) {
                        const isAvailableDay = availableDays.includes(date.getDay());
                        const isSelectedDay = selectedDays.includes(date.getDay());
                        const isHoliday = holidays.some(holiday => 
                            holiday.getDate() === date.getDate() &&
                            holiday.getMonth() === date.getMonth() &&
                            holiday.getFullYear() === date.getFullYear()
                        );
                        const isBreak = breaks.some(breakRange => 
                            date >= breakRange.start && date <= breakRange.end
                        );
                        return !(isAvailableDay && isSelectedDay) || isHoliday || isBreak;
                    }
                }
            });

            dropdown.addEventListener('change', async function() {
                const endDate = new Date(this.value);
                const startDate = document.querySelector('[wized="date_starDate"]').value;
                if (startDate) {
                    try {
                        const daysBetween = calculateNumberOfDays(new Date(startDate), endDate, availableDays, selectedDays);
                        const selectedSchedule = product.filter(schedule => selectedDays.includes(dayMap[schedule.DaysOfWeek]));
                        await Wized.data.setCookie("selectedDays", JSON.stringify(selectedSchedule));    
                        await Wized.data.setCookie("startdate", startDate);
                        await Wized.data.setCookie("enddate", endDate);
                        await Wized.data.setCookie("noOfDays", daysBetween);
                    } catch (error) {
                        console.error("Error:", error); 
                    }
                } else {
                    alert('Start date not defined');
                }
            });

            picker.show(); 
            picker_start.show();
        }, 2000);
    });
};
</script>
