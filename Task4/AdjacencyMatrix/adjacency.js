
function groupBy(xs, key) {
    return xs.reduce(function(rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
}

function sortAlphabetically(a, b) {
    a = a.toUpperCase(); // ignore upper and lowercase
    b = b.toUpperCase(); // ignore upper and lowercase
    if (a < b) {
        return -1;
    }
    if (a > b) {
        return 1;
    }

    // names must be equal
    return 0;
}

async function build() {
    console.log("Hello world");

    const orgs = await d3.csv("org.csv");
    const techs = await d3.csv("tech.csv");
    const matrixSource = await d3.csv("matrix.csv");

    console.table(orgs);
    console.table(techs);
    console.table(matrixSource);

    // Сгруппировать организации по странам
    const orgsGrouped = groupBy(orgs, "country");
    // Сгруппировать технологии по типу
    const techsGrouped = groupBy(techs, "type");
    console.log(orgsGrouped);
    console.log(techsGrouped);

    // var countryColor = {};
    // Порядки стран и типов технологий
    const countries = ["США", "Великобритания", "Франция", "Италия", "Россия", "Япония", "международная"];
    const techTypes = ["космический-аппарат", "космическая-программа", "ракета-носитель", "самолет",
                       "телекоммуникация", "аэрокосмическая-компания", "авиакомпания"];

    // Отсортировать по порядку групп сверху и по алфавитному порядку
    orgsSorted = [];
    techsSorted = [];

    for (let i = 0; i < countries.length; i++){
        let countryOrgs = orgsGrouped[countries[i]];
        countryOrgs.sort((a, b) => sortAlphabetically(a.id, b.id))
        for(let j = 0; j < countryOrgs.length; j++)
            orgsSorted.push(countryOrgs[j]);
    }
    console.log(orgsSorted);

    for (let i = 0; i < techTypes.length; i++){
        let typeTechs = techsGrouped[techTypes[i]];
        typeTechs.sort((a, b) => sortAlphabetically(a.id, b.id))
        for(let j = 0; j < typeTechs.length; j++)
            techsSorted.push(typeTechs[j]);
    }
    console.log(techsSorted);

    // построить матрицу
    var matrix = [];
    for(let i=0; i<orgs.length; i++) {
        for(let j=0; j<techs.length; j++) {
            var org = orgsSorted[i];
            var tech = techsSorted[j];
            var weight = matrixSource.find((el) => el["Organization"] === org.id)[tech.id];
            if (weight) weight = parseInt(weight);
            else weight = 0;
            var grid = {
                id: org.id+"-"+tech.id,
                x:j,
                y:i,
                weight:weight
            }
            matrix.push(grid);
        }
    }

    var dimension = {
        width: window.innerWidth*0.65,
        height: window.innerWidth*0.65,
        margin: {
            top: 180,
            right: 10,
            bottom: 10,
            left: 260
        }
    }

    dimension.boundedWidth = dimension.width
        - dimension.margin.right
        - dimension.margin.left;

    dimension.boundedHeight = dimension.height
        - dimension.margin.top
        - dimension.margin.bottom;

    const wrapper = d3.select("#wrapper")
        .append("svg")
        .attr("width", dimension.width)
        .attr("height", dimension.height)

    const bounds = wrapper.append("g")
        .style("transform",`translate(${dimension.margin.left}px,${dimension.margin.top}px)`);

    const pole = bounds
        .selectAll("rect")
        .data(matrix)
        .enter()
        .append("rect")
        .attr("class","grid")
        .attr("width",25)
        .attr("height",25)
        .attr("x", d=>d.x*25)
        .attr("y", d=>d.y*25)
        .style("fill-opacity", d=>d.weight*0.2)

    const namesX = wrapper
        .append("g")
        .attr("transform", `translate(${dimension.margin.left},${dimension.margin.top - 10})` )
        .selectAll("text")
        .data(techsSorted)
        .enter()
        .append("text")
        .attr("y",(d,i)=> i*25+16)
        .text(d=>d.id)
        .style("text-anchor","start")
        .attr("transform", "rotate(270)")
        .attr("class", d=>d["type"]);

    const namesY = wrapper
        .append("g")
        .attr("transform", `translate(${dimension.margin.left - 10},${dimension.margin.top})`)
        .selectAll("text")
        .data(orgsSorted)
        .enter()
        .append("text")
        .attr("y",(d,i)=> i*25+16)
        .text(d=>d.id)
        .style("text-anchor","end")
        .attr("class", d=>d["country"]);
}

build();