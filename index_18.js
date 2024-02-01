var urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('trial') === 'true') {
    var element = document.querySelector('[wized="non_trial_wrapper"]');
    if (element) {
        element.style.display = 'none';
    }
}


function getDynamicHolidays(year) {
    const dynamicHolidays = [];

    // Good Friday (2 days before Easter Sunday)
    let goodFriday = getEasterDate(year).subtract(2, 'days');
    dynamicHolidays.push(moment(goodFriday));

    // Easter Monday (the day after Easter Sunday)
    //let easterMonday = getEasterDate(year).add(1, 'days');
    //dynamicHolidays.push(moment(easterMonday));

    // Thanksgiving (second Monday of October)
    let thanksgiving = moment(`${year}-10-01`).startOf('month').day(8);
    dynamicHolidays.push(moment(thanksgiving));

    // Victoria Day (last Monday before May 25)
    let victoriaDay = moment(`${year}-05-25`).subtract(7, 'days').day('Monday');
    dynamicHolidays.push(moment(victoriaDay));

    // Labour Day (first Monday of September)
    let labourDay = moment(`${year}-09-01`).day('Monday');
    dynamicHolidays.push(moment(labourDay));

    return dynamicHolidays;
}

function getEasterDate(year) {
    // Algorithm to calculate Easter date...
    let C = Math.floor(year / 100);
    let N = year - 19 * Math.floor(year / 19);
    let K = Math.floor((C - 17) / 25);
    let I = C - Math.floor(C / 4) - Math.floor((C - K) / 3) + 19 * N + 15;
    I = I - 30 * Math.floor((I / 30));
    I = I - Math.floor(I / 28) * (1 - Math.floor(I / 28) * Math.floor(29 / (I + 1)) * Math.floor((21 - N) / 11));
    let J = year + Math.floor(year / 4) + I + 2 - C + Math.floor(C / 4);
    J = J - 7 * Math.floor(J / 7);
    let L = I - J;
    let month = 3 + Math.floor((L + 40) / 44);
    let day = L + 28 - 31 * Math.floor(month / 4);

    return moment(new Date(year, month - 1, day));
}

window.onload = async () => {
const currentYear = moment().year();

const show_date = `${currentYear}-06-28`2
 

  const years = [2024, 2025, 2026];
    let holidays = [];

    years.forEach(year => {
        // Add fixed-date holidays for each year
        holidays.push(...getFixedHolidays(year));

        // Add dynamic holidays for each year
        holidays.push(...getDynamicHolidays(year));

        // Add breaks for each year
        holidays.push(...getBreaks(year));
    });

    // Example: Log dates
    holidays.forEach(date => {
        console.log(date.format('YYYY-MM-DD'));
    });






function isHolidayOrBreak(date) {
    return holidays.some(holiday => 
        holiday.date() === date.date() &&
        holiday.month() === date.month() &&
        holiday.year() === date.year()
    ) ||
    breaks.some(breakRange => 
        date.isBetween(breakRange.start, breakRange.end, 'day', '[]')
    );
}


    // Function to calculate number of days excluding holidays and breaks
    function calculateNumberOfDays(startDate, endDate, availableDays, selectedDays) {
        let count = 0;
        let curDate = moment(startDate);

        while (curDate.isBefore(endDate)) {
            if (availableDays.includes(curDate.day()) &&
                selectedDays.includes(curDate.day()) &&
                !isHolidayOrBreak(curDate)) {
                count++;
            }
            curDate.add(1, 'days');
        }

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
                                picker.renderAll();
                            }
                        }, 200); // 200ms delay
                    });
                });
            }

            availableDays = product.map(schedule => dayMap[schedule.DaysOfWeek]);

            const radioButtons = document.querySelectorAll('input[type="radio"][name="end_date"]');
            const checkedRadio = document.querySelector('input[type="radio"][name="end_date"]:checked');
            const checkedValue = checkedRadio ? checkedRadio.value : null;
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
                        const momentDate = moment(date);
                        const isAvailableDay = availableDays.includes(momentDate.day());
                        const isSelectedDay = selectedDays.includes(momentDate.day());
                        const isHoliday = holidays.some(holiday => 
                            holiday.date() === momentDate.date() &&
                            holiday.month() === momentDate.month() &&
                            holiday.year() === momentDate.year()
                        );
                        const isBreak = breaks.some(breakRange => 
                            momentDate.isBetween(breakRange.start, breakRange.end, 'day', '[]')
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
                        const endDate = new Date(checkedValue); 
                        const startDate = picker_start.getDate();
                        const selectedSchedule = product.filter(schedule => selectedDays.includes(dayMap[schedule.DaysOfWeek]));
                        Wized.data.setCookie("selectedDays", JSON.stringify(selectedSchedule));    
                        Wized.data.setCookie("startdate", startDate);
                        Wized.data.setCookie("enddate", endDate);
                        Wized.data.setCookie("noOfDays", calculateNumberOfDays(startDate, endDate, availableDays, selectedDays));
                        
                        // Logic for managing radio group options based on start date
                        const radioButtons = document.querySelectorAll('input[type="radio"][name="end_date"]');

                          
                        const schoolTermStartDate = new Date();
                        const schoolTermEndDate = new Date('2024-07-02');
                        const summerTermStartDate = new Date('2024-07-02');

                        const summerTermEndDate = new Date('2024-08-31');
                        const fullTermStartDate = new Date('2024-07-02');
                        const fullTermEndDate = new Date('2024-08-31');
                        const summerTermStartDateNextYear = new Date('2025-07-02');
                        
                        if (startDate <= schoolTermEndDate) {
                            // School Term
                            restoreOriginalRadioButtons(radioButtons);
                        } else if (startDate >= summerTermStartDate && startDate <= summerTermEndDate) {
                            // Summer Term
                            restoreOriginalRadioButtons(radioButtons);
                            // Hide radio option with value 25 June 2024
                            hideRadioButton(radioButtons, '28 June 2024');
                        } else if (startDate > summerTermEndDate) {
                            // Full Term
                            // Hide radio options with values 25 June 2024 and 31 August 2024
                            restoreOriginalRadioButtons(radioButtons);
                            hideRadioButton(radioButtons, '28 June 2024');
                            hideRadioButton(radioButtons, '31 August 2024');
                        } else if (startDate > summerTermEndDate && startDate <=summerTermStartDateNextYear ){
                            restoreOriginalRadioButtons(radioButtons);
                            hideRadioButton(radioButtons, '28 June 2024');
                            hideRadioButton(radioButtons, '31 August 2024');
                            hideRadioButton(radioButtons, '28 June 2025');
                        } else {
                            // Restore the original visibility state of radio buttons
                            restoreOriginalRadioButtons(radioButtons);
                        }
                    
                        if (date instanceof Date) {
                            const lockPlugin = picker.PluginManager.getInstance('LockPlugin');
                            lockPlugin.options.maxDate = date;
                            picker.renderAll();
                        }
                    });
                    function hideRadioButton(radioButtons, value) {
                        radioButtons.forEach(radioButton => {
                            if (radioButton.value === value) {
                                radioButton.dataset.originalDisplay = radioButton.parentNode.style.display; // Store original display value
                                radioButton.parentNode.style.display = 'none'; // Hide the radio button
                            }
                        });
                    }
                    
                    function restoreOriginalRadioButtons(radioButtons) {
                        radioButtons.forEach(radioButton => {
                            if (radioButton.dataset.originalDisplay !== undefined) {
                                radioButton.parentNode.style.display = radioButton.dataset.originalDisplay; // Restore original display value
                            }
                        });
                    }
                },
                plugins: ['LockPlugin'],
                 LockPlugin: {
                    minDate: new Date().toISOString(),
                    filter(date, picked) {
                        const momentDate = moment(date);
                        const isAvailableDay = availableDays.includes(momentDate.day());
                        const isSelectedDay = selectedDays.includes(momentDate.day());
                        const isHoliday = holidays.some(holiday => 
                            holiday.date() === momentDate.date() &&
                            holiday.month() === momentDate.month() &&
                            holiday.year() === momentDate.year()
                        );
                        const isBreak = breaks.some(breakRange => 
                            momentDate.isBetween(breakRange.start, breakRange.end, 'day', '[]')
                        );
                        return !(isAvailableDay && isSelectedDay) || isHoliday || isBreak;
                    }
                }
            });
            

            radioButtons.forEach(radio => {
                radio.addEventListener('change', async function() {
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
            });

            picker.show(); 
            picker_start.show();
        }, 2000);
    });

};
