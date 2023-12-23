var page_content = null;
var isPrintablePage = false;
var classStartDates = [
	new Date('2024-01-15T00:00:00'),
	new Date('2024-08-12T00:00:00'),
	new Date('2025-01-13T00:00:00'),
];
var classEndDates = [
	new Date('2024-04-20T00:00:00'),
	new Date('2024-11-16T00:00:00'),
	new Date('2025-04-19T00:00:00'),
];
var currentStartDate;
var currentEndDate;
var test =
	'BEGIN:VCALENDAR\n' +
	'CALSCALE:GREGORIAN\n' +
	'METHOD:PUBLISH\n' +
	'PRODID:-//Test Cal//EN\n' +
	'VERSION:2.0\n';
var courses = [];
var selectedCourses = [];
var intialized = false;
var expanded = false;
var elems;
var data = [];
var parser = new DOMParser();
var doc;
let sortable;
const monthMap = {
	Jan: '01',
	Feb: '02',
	Mar: '03',
	Apr: '04',
	May: '05',
	Jun: '06',
	Jul: '07',
	Aug: '08',
	Sep: '09',
	Oct: '10',
	Nov: '11',
	Dec: '12',
};

function formatDateToICS(date, allDay = false) {
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	const seconds = date.getSeconds().toString().padStart(2, '0');

	if (allDay) return `${year}${month}${day}`;
	return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

const toMilliseconds = (hrs, min) =>
	(parseInt(hrs) * 60 * 60 + parseInt(min) * 60) * 1000;

Date.prototype.addDays = function (days) {
	var date = new Date(this.valueOf());
	date.setDate(date.getDate() + days);
	return date;
};

for (var i = 0; i < classStartDates.length; i++) {
	if (classEndDates[i].getTime() > Date.now()) {
		currentStartDate = classStartDates[i];
		currentEndDate = classEndDates[i];
		break;
	}
}

function isNumber(n) {
	return !isNaN(parseInt(n)) && isFinite(n);
}

class Course {
	constructor(index, code, title, au, exam) {
		this.index = index;
		this.code = code;
		this.title = title;
		this.au = au;
		this.exam = exam;
	}
}

document.addEventListener('DOMContentLoaded', function () {
	$('[id="start_date"]').datepicker({
		date: currentStartDate,
		format: 'dd/mm/yyyy',
	});
	$('[id="start_date"]').datepicker('setDate', currentStartDate);

	$('[id="end_date"]').datepicker({
		date: currentEndDate,
		format: 'dd/mm/yyyy',
		startDate: currentStartDate,
	});
	$('[id="end_date"]').datepicker('setDate', currentEndDate);
	const dragItem = document.getElementById('title-components');
	sortable = new Sortable(dragItem, {
		animation: 250,
		swapThreshold: 0.75,
		chosenClass: 'sortable-chosen',
		dragClass: 'sortable-drag',
		onEnd: function (evt) {
			let ar = sortable.toArray();
			for (var i = 0; i < sortable.toArray().length; i++) {
				document.getElementById(ar[i]).style.order = i + 1;
			}
		},
	});

	function modifyDOM() {
		return {
			innerHTML: document.body.innerHTML,
			pageLink: window.location.href,
		};
	}

	let tabid = 0;
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		tabid = tabs[0].id;
	});

	var toggled = false;
	document.getElementById('helpButton').addEventListener('click', function () {
		if (toggled) {
			document.getElementById('helpText').style.display = 'none';
			toggled = false;
		} else {
			document.getElementById('helpText').style.display = 'block';
			toggled = true;
		}
	});

	document
		.getElementById('expand_btn')
		.addEventListener('click', async function () {
			await chrome.scripting.executeScript(
				{
					target: {
						tabId: tabid,
						allFrames: true,
					},
					function: modifyDOM,
				},
				(results) => {
					try {
						page_content = results[0].result.innerHTML;
						pageLink = results[0].result.pageLink;
						if (
							pageLink !=
							'https://wish.wis.ntu.edu.sg/pls/webexe/AUS_STARS_PLANNER.planner'
						) {
							document.getElementById('updateText').innerHTML =
								'Oops! Wrong Site! &#128561;';
						} else {
							if (courses.length == 0) {
								populateCourses();
								selectedCourses = [...courses];
							}
							if (courses.length == 0) {
								document.getElementById('updateText').innerHTML =
									'Oops! No courses found! &#128557;';
								return;
							}

							if (expanded) {
								document.getElementById('course_select').style.display = 'none';
								document.getElementById('expand_icon').className =
									'fa fa-chevron-right';
								expanded = false;
							} else {
								document.getElementById('course_select').style.display =
									'block';
								document.getElementById('expand_icon').className =
									'fa fa-chevron-left';
								expanded = true;
							}
							if (intialized) return;

							let table = document.getElementById('course_select_table');
							courses.forEach((course) => {
								let row = table.insertRow(-1);
								let selectCell = row.insertCell(0);
								let courseCell = row.insertCell(1);

								selectCell.innerHTML = `<input type="checkbox" id="${course.code}_checkbox" checked>`;
								selectCell.className = 'center';
								courseCell.innerHTML = `${course.code}: ${course.title}`;
								selectCell.addEventListener('click', function () {
									if (this.firstChild.checked) {
										selectedCourses.push(course);
									} else {
										selectedCourses = selectedCourses.filter(
											(selectedCourse) => selectedCourse.code !== course.code
										);
									}
								});
							});
							intialized = true;
						}
					} catch (err) {
						document.getElementById('updateText').innerHTML =
							'Oops! Wrong Site! &#128561;';
					}
				}
			);
		});

	document
		.getElementById('generateButton')
		.addEventListener('click', async function () {
			await chrome.scripting.executeScript(
				{
					target: {
						tabId: tabid,
						allFrames: true,
					},
					function: modifyDOM,
				},
				(results) => {
					try {
						page_content = results[0].result.innerHTML;
						pageLink = results[0].result.pageLink;
						if (
							pageLink !=
							'https://wish.wis.ntu.edu.sg/pls/webexe/AUS_STARS_PLANNER.planner'
						) {
							document.getElementById('updateText').innerHTML =
								'Oops! Wrong Site! &#128561;';
						} else {
							document.getElementById('updateText').innerHTML =
								'Be sure to share with your friends! &#128521';
						}
						if (courses.length == 0) {
							populateCourses();
							selectedCourses = [...courses];
						}
						if (courses.length == 0) {
							document.getElementById('updateText').innerHTML =
								'Oops! No courses found! &#128557;';
							return;
						}
						readSchedule();
					} catch (err) {
						document.getElementById('updateText').innerHTML =
							'Oops! Wrong Site! &#128561;';
					}
				}
			);
		});
});

function populateCourses() {
	var tmp;
	doc = parser.parseFromString(page_content, 'text/html');
	elems = doc.getElementsByTagName('table');

	for (var i = 0; i < elems.length; i++) {
		if (elems[i].getAttribute('cellspacing') == '0') {
			tmp = elems[i].innerHTML;
			break;
		}
	}

	courses = [];
	elements = parser.parseFromString(tmp, 'text/html');
	data = elements.body.innerText.split('\n').filter((n) => n);
	if (data[0] === 'Index') isPrintablePage = true;
	for (var i = isPrintablePage ? 6 : 7; i < data.length - 3; i += 6) {
		var index = data[i];
		var code = data[i + 1];
		var title = data[i + 2];
		var au = data[i + 3];
		var examTiming;

		if (data[i + 5] === 'Not Applicable') examTiming = ['Not Applicable'];
		else {
			var time = data[i + 5].replace('hrs', '').trim().split(' ');
			var date = time[0].split('-');
			var dateString = date[2] + '-' + monthMap[date[1]] + '-' + date[0];
			var timeSplit = time[1].split('to');
			var startTime =
				timeSplit[0].substring(0, timeSplit[0].length - 2) +
				':' +
				timeSplit[0].substring(timeSplit[0].length - 2);
			var endTime =
				timeSplit[1].substring(0, timeSplit[1].length - 2) +
				':' +
				timeSplit[1].substring(timeSplit[1].length - 2);

			examTiming = [
				new Date(Date.parse(dateString + 'T' + startTime)),
				new Date(Date.parse(dateString + 'T' + endTime)),
			];
		}
		courses.push(new Course(index, code, title, au, examTiming));
	}
}

function readSchedule() {
	if (selectedCourses.length == 0) {
		document.getElementById('updateText').innerHTML =
			'You have not selected any courses! &#128557;';
		return;
	}
	currentStartDate = $('[id="start_date"]').datepicker('getDate');
	currentEndDate = $('[id="end_date"]').datepicker('getDate');

	var scheduleTable = doc.getElementsByTagName('table');
	let order = sortable.toArray();

	for (var i = 0; i < scheduleTable.length; i++) {
		if (scheduleTable[i].getAttribute('cellspacing') == '1') {
			scheduleTable = scheduleTable[i];
			break;
		}
	}
	var schedule = Array.prototype.map.call(
		scheduleTable.querySelectorAll('tr'),
		function (tr) {
			return Array.prototype.map.call(tr.querySelectorAll('td'), function (td) {
				return td.innerText.trim();
			});
		}
	);
	for (var i = 1; i < schedule.length; i++) {
		for (var j = 1; j < schedule[i].length; j++) {
			if (schedule[i][j] != '') {
				var modList = schedule[i][j].split(';').filter((n) => n);
				for (var k = 0; k < modList.length; k++) {
					var courseData = modList[k].split(' ');
					var courseCode = courseData[0];
					if (selectedCourses.find((x) => x.code == courseCode) == undefined)
						continue;
					var classType = courseData[1];
					var tutGroup = courseData[2];
					var courseFreq;
					if (courseData[3]) {
						if (courseData[3].includes('-Wk1,3,5,7,9,11,13')) {
							courseFreq = 'odd';
							courseData[3] = courseData[3].replace('-Wk1,3,5,7,9,11,13', '');
						} else if (courseData[3].includes('-Wk2,4,6,8,10,12')) {
							courseFreq = 'even';
							courseData[3] = courseData[3].replace('-Wk2,4,6,8,10,12', '');
						} else {
							var split = courseData[3].split('-Wk');
							var num = split[1] ? split[1] : '1-13';
							courseData[3] = split[0];
							if (isNumber(num)) {
								courseFreq = num;
							} else if (num.split('-').length == 2) {
								var num1 = num.split('-')[0];
								var num2 = num.split('-')[1];
								if (isNumber(num1) && isNumber(num2)) {
									courseFreq = num1 + '-' + num2;
								}
							}
						}
					}
					var timingTmp = courseData[3].substring(courseData[3].length - 10); // to get the time which is always the last 10 digits
					var location = courseData[3].replace(timingTmp, '');
					var timing = timingTmp.split('to');
					var startTime = new Date(
						currentStartDate.getTime() +
							toMilliseconds(
								timing[0].substring(0, timing[0].length - 2),
								timing[0].substring(timing[0].length - 2)
							)
					).addDays(j - 1);
					var endTime = new Date(
						currentStartDate.getTime() +
							toMilliseconds(
								timing[1].substring(0, timing[1].length - 2),
								timing[1].substring(timing[1].length - 2)
							)
					).addDays(j - 1);

					var course = courses.find((x) => x.code == courseCode);
					if (course != undefined) {
						var afterRecessStart, afterRecessEnd;
						var freq, afterRecessFreq, schedules;
						var beforeRecessWeek = currentStartDate.addDays(7 * 7 - 1);
						if (courseFreq === 'odd') {
							freq =
								'WEEKLY;INTERVAL=2;UNTIL=' + formatDateToICS(beforeRecessWeek);
							afterRecessStart = startTime.addDays(7 * 9);
							afterRecessEnd = endTime.addDays(7 * 9);
							afterRecessFreq =
								'WEEKLY;INTERVAL=2;UNTIL=' + formatDateToICS(currentEndDate);
							schedules = 'Odd Weeks starting from Week 1';
						} else if (courseFreq === 'even') {
							startTime = startTime.addDays(7);
							endTime = endTime.addDays(7);
							freq =
								'WEEKLY;INTERVAL=2;UNTIL=' + formatDateToICS(beforeRecessWeek);
							afterRecessStart = startTime.addDays(7 * 7);
							afterRecessEnd = endTime.addDays(7 * 7);
							afterRecessFreq =
								'WEEKLY;INTERVAL=2;UNTIL=' + formatDateToICS(currentEndDate);
							schedules = 'Even Weeks starting from Week 2';
						} else if (isNumber(courseFreq)) {
							freq = 0;
							schedules = 'Week ' + courseFreq;
						} else if (courseFreq.split('-').length == 2) {
							var num1 = courseFreq.split('-')[0];
							var num2 = courseFreq.split('-')[1];
							var padding = num1 <= 7 ? num1 - 1 : num1;
							startTime = startTime.addDays(7 * padding);
							endTime = endTime.addDays(7 * padding);

							if (num2 > 7) {
								afterRecessStart = startTime.addDays(7 * (8 - num1 + 1));
								afterRecessEnd = endTime.addDays(7 * (8 - num1 + 1));
								afterRecessFreq =
									'WEEKLY;UNTIL=' + formatDateToICS(currentEndDate);
							} else if (num2 < 7) {
								beforeRecessWeek = startTime.addDays(7 * num2 - 1);
							}
							freq = 'WEEKLY;UNTIL=' + formatDateToICS(beforeRecessWeek);
							schedules = 'Week ' + num1 + ' to ' + num2;
						}

						var originalStartTime = startTime;
						var summary = '';
						for (var m = 0; m < order.length; m++) {
							if (order[m] == 'courseCode') summary += courseCode + ' ';
							else if (order[m] == 'classType') summary += classType + ' ';
							else if (order[m] == 'tutorialGroup') summary += tutGroup + ' ';
						}
						summary = summary.trim();

						var description = '';
						if (document.getElementById('courseName').checked)
							description += course.title + '\\n';
						if (document.getElementById('au').checked)
							description += 'AU(s): ' + course.au + '\\n';
						if (document.getElementById('index').checked)
							description += 'Index: ' + course.index + '\\n';
						if (document.getElementById('schedule').checked)
							description += 'Schedule: ' + schedules + '\\n';

						if (freq === 0) {
							test += 'BEGIN:VEVENT\n';
							test += 'SUMMARY:' + summary + '\n';
							test += 'DTSTART:' + formatDateToICS(startTime) + '\n';
							test += 'DTEND:' + formatDateToICS(endTime) + '\n';
							test += 'DTSTAMP:' + formatDateToICS(new Date()) + '\n';
							test += 'DESCRIPTION:' + description + '\n';
							test += 'LOCATION:' + location + '\n';
							test += 'BEGIN:VALARM\n';
							test += 'TRIGGER:-PT30M\n';
							test += 'REPEAT:1\n';
							test += 'ACTION:DISPLAY\n';
							test += 'END:VALARM\n';
							test +=
								'UID:' +
								courseCode +
								classType +
								tutGroup +
								formatDateToICS(startTime) +
								'\n';
							test += 'END:VEVENT\n';
							continue;
						}

						for (var l = 0; l < 2; l++) {
							if (l == 1) {
								freq = afterRecessFreq;
								startTime = afterRecessStart;
								endTime = afterRecessEnd;
								if (!startTime) continue;
							}

							test += 'BEGIN:VEVENT\n';
							test += 'SUMMARY:' + summary + '\n';
							test += 'DTSTART:' + formatDateToICS(startTime) + '\n';
							test += 'DTEND:' + formatDateToICS(endTime) + '\n';
							test += 'DTSTAMP:' + formatDateToICS(new Date()) + '\n';
							test += 'DESCRIPTION:' + description + '\n';
							test += 'RRULE:FREQ=' + freq + '\n';
							test += 'LOCATION:' + location + '\n';
							test += 'BEGIN:VALARM\n';
							test += 'TRIGGER:-PT30M\n';
							test += 'REPEAT:1\n';
							test += 'ACTION:DISPLAY\n';
							test += 'END:VALARM\n';
							test +=
								'UID:' +
								courseCode +
								classType +
								tutGroup +
								formatDateToICS(startTime) +
								'\n';
							if (l == 1)
								test +=
									'RELATED-TO:' +
									courseCode +
									classType +
									tutGroup +
									formatDateToICS(originalStartTime) +
									'\n';
							else
								test +=
									'RELATED-TO:' +
									courseCode +
									classType +
									tutGroup +
									formatDateToICS(afterRecessStart) +
									'\n';
							test += 'END:VEVENT\n';
						}
					}
				}
			}
		}
	}
	selectedCourses.forEach((course) => {
		var exam = course.exam;
		if (exam[0] === 'Not Applicable') return;
		test += 'BEGIN:VEVENT\n';
		test += 'SUMMARY:' + course.code + ' Finals\n';
		test += 'DTSTART:' + formatDateToICS(exam[0]) + '\n';
		test += 'DTEND:' + formatDateToICS(exam[1]) + '\n';
		test += 'DTSTAMP:' + formatDateToICS(new Date()) + '\n';
		test +=
			'DESCRIPTION:' +
			course.title +
			'\\nAU(s): ' +
			course.au +
			'\\nIndex: ' +
			course.index +
			'\n';
		test += 'LOCATION:Exam Hall\n';
		test += 'BEGIN:VALARM\n';
		test += 'TRIGGER:-PT30M\n';
		test += 'REPEAT:1\n';
		test += 'ACTION:DISPLAY\n';
		test += 'END:VALARM\n';
		test += 'UID:' + course.code + 'Exam' + formatDateToICS(exam[0]) + '\n';
		test += 'END:VEVENT\n';
	});

	test += 'BEGIN:VEVENT\n';
	test += 'SUMMARY:' + 'Recess Week\n';
	test +=
		'DTSTART:' + formatDateToICS(currentStartDate.addDays(7 * 7), true) + '\n';
	test +=
		'DTEND:' +
		formatDateToICS(currentStartDate.addDays(7 * 8 - 2), true) +
		'\n';
	test += 'DTSTAMP:' + formatDateToICS(new Date()) + '\n';
	test += 'DESCRIPTION:ITS RECESS WEEK!!!!!\n';
	test += 'LOCATION:GO HOME\n';
	test += 'UID:RECESSWEEK\n';
	test += 'END:VEVENT\n';

	test += 'END:VCALENDAR';
	saveICSFile(test, 'STARS Cal.ics');
}

function saveICSFile(icsString, fileName) {
	const blob = new Blob([icsString], { type: 'text/calendar' });

	// Check if the browser supports the 'download' attribute
	if (navigator.msSaveBlob) {
		// For IE/Edge browsers
		navigator.msSaveBlob(blob, fileName);
	} else {
		// For other browsers
		const link = document.createElement('a');
		if (link.download !== undefined) {
			// Create a link element with the download attribute
			const url = URL.createObjectURL(blob);
			link.setAttribute('href', url);
			link.setAttribute('download', fileName);

			// Append the link to the document body
			document.body.appendChild(link);

			// Trigger a click event on the link
			link.click();

			// Clean up the URL and link
			URL.revokeObjectURL(url);
			document.body.removeChild(link);
		} else {
			// console.error('Error: Unable to save ICS file. Your browser does not support the "download" attribute.');
		}
	}
}
