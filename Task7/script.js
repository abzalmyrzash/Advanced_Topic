function clearBox(elementID)
{
    document.getElementById(elementID).innerHTML = "";
}

function parseDate(str){
    let bracket_ind = str.indexOf('(');
    if(bracket_ind !== -1) return new Date(str.substring(0, bracket_ind));
    return new Date(str);
}

function isLeapYear(year){
    if(year % 400 === 0) return true;
    if(year % 100 === 0) return false;
    return year % 4 === 0;
}

function getNumDaysInMonth(month, year){
    //                 Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
    let daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    // if February
    if(month === 1){
        if(isLeapYear(year)) return 29;
        return 28;
    }
    return daysInMonth[month];
}

const NUM_MS_IN_DAY = 1000 * 60 * 60 * 24;

class DateRange{
    static ONE_DAY = 0;
    static ONE_MONTH = 1;
    static MANY_MONTHS = 2;
    static ONE_YEAR = 3;
    static MANY_YEARS = 4;

    constructor(array) {
        this.minDate = array[0];
        this.maxDate = array[1];

        this.minDateY = this.minDate.getFullYear();
        this.maxDateY = this.maxDate.getFullYear();
        this.minDateM = this.minDate.getMonth();
        this.maxDateM = this.maxDate.getMonth();
        this.minDateD = this.minDate.getDate();
        this.maxDateD = this.maxDate.getDate();

        this.diffYears = this.maxDateY - this.minDateY // difference in years
        this.diffMonths = this.maxDateM - this.minDateM; // difference in months
        this.diffMonthsFull = this.diffYears * 12 + this.diffMonths; // full difference in months
        this.diffDays = this.maxDateD - this.minDateD; // difference in days
        this.diffTime = this.maxDate - this.minDate; // full difference in milliseconds
        this.diffDaysFull = this.diffTime / NUM_MS_IN_DAY;

        if(this.diffDaysFull === 1){
            this.period = DateRange.ONE_DAY;
            this.format = "";
        }
        else if(this.diffMonthsFull === 1 && this.diffDays === 0){
            this.period = DateRange.ONE_MONTH;
            this.format = "%_d";
        }
        else if(this.diffYears === 0 && this.diffMonthsFull > 1){
            this.period = DateRange.MANY_MONTHS;
            this.format = "%b";
        }
        else if(this.diffYears === 1){
            this.period = DateRange.ONE_YEAR;
            this.format = "%b";
        }
        else if(this.diffYears > 1){
            this.period = DateRange.MANY_YEARS;
            this.format = "%Y";
        }
        else {
            console.error("Invalid date range!");
        }
    }

    includes(date){
        return date >= this.minDate && date < this.maxDate;
    }

    generateDateTicks(){
        this.ticks = [];
        if(this.period === DateRange.ONE_MONTH){
            // if the range is 1 month divide into days
            let numDays = getNumDaysInMonth(this.minDateM, this.minDateY);
            for(let i = 1; i <= numDays + 1; i++){
                let date = new Date(this.minDateY, this.minDateM, i);
                this.ticks.push(date);
            }
        }
        else if(this.period === DateRange.ONE_YEAR){
            // if the range is 1 year divide into months
            for(let i = 0; i <= 12; i++){
                let date = new Date(this.minDateY, i, 1);
                if(date > this.maxDate) break;
                this.ticks.push(date);
            }
        }
        else if(this.period === DateRange.MANY_YEARS){
            // if the range is multiple years divide into years
            for(let i = 0; i <= this.diffYears; i++) {
                let date = new Date(this.minDateY+i, 0, 1);
                this.ticks.push(date);
            }
        }
        this.tickRanges = [];
        for(let i = 0; i < this.ticks.length-1; i++){
            this.tickRanges.push(this.getOneTickRange(this.ticks[i]))
        }
        // console.log(this.tickRanges);
    }

    static getOneYearRange(year){
        let minDate = new Date(year, 0, 1);
        let maxDate = new Date(year+1, 0, 1);
        return new DateRange([minDate, maxDate]);
    }

    static getOneMonthRange(year, month){
        let minDate = new Date(year, month, 1);
        let maxDate = new Date(year, month+1, 1);
        return new DateRange([minDate, maxDate]);
    }

    static getOneDayRange(year, month, day){
        let minDate = new Date(year, month, day);
        let maxDate = new Date(year, month, day+1);
        return new DateRange([minDate, maxDate]);
    }

    getOneTickRange(date){
        let year = date.getFullYear();
        let month = date.getMonth();
        let day = date.getDate();

        if(this.period === DateRange.MANY_YEARS){
            return DateRange.getOneYearRange(year);
        }
        else if(this.period === DateRange.ONE_YEAR){
            return DateRange.getOneMonthRange(year, month);
        }
        else if(this.period === DateRange.ONE_MONTH){
            return DateRange.getOneDayRange(year, month, day);
        }
    }

    toArray(){
        return [this.minDate, this.maxDate];
    }
}

const monthList = ['All', 'January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December']

class Main {
    static data;
    static yearList = ['All'];
    static clusters = ['SDC', 'MDS', 'WMS']
    static clusterMap = {
        'system,design,control': 'SDC',
        'mission,data,spacecraft': 'MDS',
        'wind,magnetic,solar': 'WMS'
    };
    static color = {
        'SDC': '#ff0000',
        'MDS': '#00ff00',
        'WMS': '#0000ff'
    }
    static clusterData = {'SDC':[], 'MDS':[], 'WMS':[]};
    static papers = {'SDC':[], 'MDS':[], 'WMS':[]};

    static async start() {
        await this.loadData();
        // let dateRange = this.getDateRange();
        let dateRangeFullYears = this.getDateRangeFullYears();
        // let dateRange2 = new DateRange([new Date(1996, 0, 1), new Date(1997, 0, 1)]);

        this.papers.SDC = this.getPapersByCluster('SDC');
        this.papers.MDS = this.getPapersByCluster('MDS');
        this.papers.WMS = this.getPapersByCluster('WMS');
        // console.table(this.papers);


        this.build(dateRangeFullYears);

        let yearSelectD3 = d3.select('#year-select')
            .on("change", function(event) {
                Main.yearChange()
            });
        var yearOptions = yearSelectD3
            .selectAll('yearOptions')
            .data(this.yearList)
            .enter()
            .append("option")
            .text((d) => d)
            .attr("value", (d) => d);

        this.yearSelect = document.getElementById('year-select');

    }

    static async loadData() {
        this.rawData = await d3.json("processed_spacearxiv.json");
        this.data = {};
        let d = [];
        this.columns = ['title', 'date_publ', 'authors', 'url', 'url_pdf', 'categories',
            'abstract', 'cleaned_abstract', 'cluster']
        for (var j in this.columns) {
            let column = this.columns[j]
            d = [];
            for (var i in this.rawData[column]) {
                d.push(this.rawData[column][i]);
            }
            this.data[column] = d;
        }
        for (let i = 0; i < this.data.date_publ.length; i++) {
            this.data.date_publ[i] = parseDate(this.data.date_publ[i]);
        }
        this.dataLength = this.data['title'].length;
        this.getDataArray();
    }

    static getDataArray(){
        this.dataArray = [];
        for(let i=0; i < this.dataLength; i++){
            let paper = {};
            for(let j=0; j < this.columns.length; j++){
                let column = this.columns[j];
                paper[column] = this.data[column][i];
            }
            this.dataArray.push(paper);
        }
        // console.table(this.dataArray);
    }

    static getPapersByCluster(cluster){
        return this.dataArray.filter(function (paper) {
            return Main.clusterMap[paper.cluster] === cluster
        });
    }

    static getPapersByDateRange(papers, dateRange){
        return papers.filter(function (paper) {
            return dateRange.includes(paper.date_publ);
        });
    }

    static countPapersByDateRange(papers, dateRange){
        let count = 0;
        for(let i = 0; i < papers.length; i++) {
            if(dateRange.includes(papers[i].date_publ)) count += 1;
        }
        return count;
    }

    static getClusterData(dateRange){
        this.clusterData = [];
        for(let i=0; i < dateRange.tickRanges.length; i++){
            let tickRange = dateRange.tickRanges[i];
            let tickPaperCount = {'d0': tickRange.minDate, 'd1': tickRange.maxDate};
            for(let j = 0; j < this.clusters.length; j++){
                let cluster = this.clusters[j];
                tickPaperCount[cluster] = Main.countPapersByDateRange(
                    Main.papers[cluster], tickRange);
            }
            this.clusterData.push(tickPaperCount);
        }
        console.table(this.clusterData);
    }

    // get precise date range of all papers
    static getDateRange(){
        let dateTimes = [];
        this.data.date_publ.forEach(date => dateTimes.push(date.getTime()));
        let minTime = Math.min(...dateTimes);
        let maxTime = Math.max(...dateTimes);
        return new DateRange([new Date(minTime), new Date(maxTime)]);
    }

    // get date range of all papers with full years
    static getDateRangeFullYears(){
        let dateYears = [];
        // get years from dates
        this.data.date_publ.forEach(date => dateYears.push(date.getFullYear()));
        this.minYear = Math.min(...dateYears);
        this.maxYear = Math.max(...dateYears);
        this.getYearList(this.minYear, this.maxYear);

        this.minDate = new Date(this.minYear, 0, 1);
        this.maxDate = new Date(this.maxYear+1, 0, 1);
        return new DateRange([this.minDate, this.maxDate]);
    }


    static getYearList(minYear, maxYear){
        for(let i = minYear; i <= maxYear; i++){
            this.yearList.push(i);
        }
    }

    static getYRange(dateRange){
        if(dateRange.period === DateRange.MANY_YEARS) return [0, 600];
        if(dateRange.period === DateRange.ONE_YEAR) return [0, 60];
        if(dateRange.period === DateRange.ONE_MONTH) return [0, 10];
    }

    static build(dateRange) {
        dateRange.generateDateTicks();
        this.getClusterData(dateRange);

        const width = document.querySelector("body").clientWidth;
        const dimension = {
            width: width,
            height: width * 0.4,
            margin: {
                left: 100,
                right: 30,
                top: 60,
                bottom: 30
            }
        };

        const chart = d3.select("#chart");
        clearBox("chart");
        const svg = chart.append("svg").attr("viewBox", [0, 0, dimension.width, dimension.height]);

        const x_scale = d3.scaleTime().domain(dateRange.toArray())
            .range([dimension.margin.left, dimension.width - dimension.margin.right]);
        const y_scale = d3.scaleLinear().domain(this.getYRange(dateRange))
            .range([dimension.height - dimension.margin.bottom - dimension.margin.top, dimension.margin.top]);


        var x_label = "Year";
        // change x label depending on date range
        if(dateRange.period === DateRange.ONE_YEAR) x_label = "" + dateRange.minDateY;
        if(dateRange.period === DateRange.ONE_MONTH) x_label =
            monthList[dateRange.minDateM + 1] + " " + dateRange.minDateY;
        const y_label = "# of research papers";

        // add y label
        svg
            .append("text")
            .attr("text-anchor", "middle")
            .attr(
                "transform",
                `translate(${dimension.margin.left - 60}, ${
                    (dimension.height - dimension.margin.top - dimension.margin.bottom + 180) / 2
                }) rotate(-90)`
            )
            .style("font-size", "32px")
            .text(y_label);
        // add x label
        svg
            .append("text")
            .attr("class", "svg_title")
            .attr("x", (dimension.width - dimension.margin.right + dimension.margin.left) / 2)
            .attr("y", dimension.height - dimension.margin.bottom - dimension.margin.top + 60)
            .attr("text-anchor", "middle")
            .style("font-size", "32px")
            .text(x_label);

        const dates = (d) => d.date_publ;

        // console.log(dateRange.ticks)

        // add x axis
        const x_axis = d3.axisBottom()
            .scale(x_scale)
            .tickPadding(10)
            .tickValues(dateRange.ticks)
            .tickSize(-dimension.height + dimension.margin.top * 2 + dimension.margin.bottom)
            .tickFormat(d3.timeFormat(dateRange.format));

        svg
            .append("g")
            .attr("id", "xAxis")
            .attr("transform", `translate(0,${dimension.height - dimension.margin.bottom - dimension.margin.top})`)
            .style("font", "14px times")
            .call(x_axis);

        // add y axis
        let ticks = 10
        const y_axis = d3.axisLeft()
            .scale(y_scale)
            .tickPadding(5)
            .ticks(ticks)
            .tickSize(-dimension.width + dimension.margin.left + dimension.margin.right);

        svg
            .append("g")
            .attr("id", "yAxis")
            .attr("transform", `translate(${dimension.margin.left},0)`)
            .call(y_axis);

        // add click functionality to date ticks
        d3.select("#xAxis")
            .selectAll("text")
            .style("cursor", "pointer")
            .on("click", function (event, date) {
                Main.clickDateTick(date, dateRange)
            });

        // Show the bars
        var stack = d3.stack()
            .keys(this.clusters)

        const stackedData = stack(this.clusterData);
        // console.log(stackedData);

        svg.append("g")
            .selectAll("g")
            // Enter the stack data = loop key per key = group per group
            .data(stackedData)
            .enter().append("g")
            .attr("fill", (d) => Main.color[d.key])
            .selectAll("rect")
            // enter a second time = loop subgroup per subgroup to add all rectangles
            .data((d) => d)
            .enter()
            .append("rect")
            .attr("x", (d) => x_scale(d.data.d0))
            .attr("y", (d) => y_scale(d[1]))
            .attr("height", (d) => y_scale(d[0]) - y_scale(d[1]))
            .attr("width",(d) => x_scale(d.data.d1) - x_scale(d.data.d0))
    }

    static clickDateTick(date, dateRange) {
        // console.log(date);
        // let newMaxDate;
        let dateY = date.getFullYear();
        let dateM = date.getMonth();

        if(dateRange.period === DateRange.ONE_YEAR){
            // if current range is 1 year go to 1 month range
            // if(dateM === 11) {
            //     newMaxDate = new Date(dateY + 1, 0, 1)
            // }
            // else {
            //     newMaxDate = new Date(dateY, dateM + 1, 1)
            // }
            this.monthSelect.value = monthList[dateM + 1];
            this.build(DateRange.getOneMonthRange(dateY, dateM));
        }
        else if(dateRange.period === DateRange.MANY_YEARS){
            if(dateY > this.maxYear) return;
            // if current range is multiple years go to 1 year range
            this.yearSelect.value = dateY;
            this.createMonthSelect();
            this.build(DateRange.getOneYearRange(dateY));
        }
        else{
            return;
        }
        // console.log(newMaxDate);

        // this.build(new DateRange([date, newMaxDate]));
    }

    static createMonthSelect(){
        if(!document.getElementById('month-label')) {
            let dropdown = d3.select('#dropdown-container');
            dropdown
                .append('label')
                .attr('id', 'month-label')
                .text('Month');
            let monthSelectD3 = dropdown
                .append('select')
                .attr('id', 'month-select')
                .on('change', function(d) {
                    Main.monthChange();
                });
            monthSelectD3
                .selectAll('monthOptions')
                .data(monthList)
                .enter()
                .append('option')
                .text((d) => d)
                .attr("value", (d) => d);
        }
        this.monthSelect = document.getElementById('month-select');
    }

    static yearChange(){
        if(this.yearSelect.value === "All"){
            this.build(new DateRange([this.minDate, this.maxDate]));
            document.getElementById('month-label').remove();
            document.getElementById('month-select').remove();
        }
        else{
            let year = parseInt(this.yearSelect.value);
            this.createMonthSelect();
            if(this.monthSelect.value === 'All') {
                this.build(DateRange.getOneYearRange(year));
            }
            else {
                let month = monthList.findIndex(x => x === this.monthSelect.value) - 1;
                this.createMonthSelect();
                this.build(DateRange.getOneMonthRange(year, month));
            }
        }
    }

    static monthChange(){
        let year = parseInt(this.yearSelect.value);
        if(this.monthSelect.value === 'All') {
            // console.log(year);
            this.build(DateRange.getOneYearRange(year));
        }
        else {
            let month = monthList.findIndex(x => x === this.monthSelect.value) - 1;
            this.createMonthSelect();
            this.build(DateRange.getOneMonthRange(year, month));
        }
    }
}
Main.start();