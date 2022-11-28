var TSNEdata, UMAPdata, centroidsTSNE, centroidsUMAP;

async function create(){
    const C_colors = d3.scaleOrdinal()
    .domain(["0", "1", "2"])
    .range(["#ff0000", "#00ff00", "#0000ff"]);

    const dimension = {
        width: window.innerWidth*0.6,
        height: window.innerHeight*0.8,
        margin: {
            top: 50,
            right: 20,
            bottom: 20,
            left: 55
        }
    }

    dimension.boundedWidth  = dimension.width  - dimension.margin.right - dimension.margin.left;
    dimension.boundedHeight = dimension.height - dimension.margin.top   - dimension.margin.bottom;

    TSNEdata = await d3.json("TSNE.json");
    UMAPdata = await d3.json("UMAP.json");
    console.table(TSNEdata);
    // console.log(calculations(TSNEdata));


    const wrapper = d3.select("#wrapper")
    .append("svg")
    .attr("style", "background: white; border: 2px solid black; position: relative; left: " + ((dimension.margin.left + dimension.margin.right))/2 + "px; top: "  + (window.innerHeight - (dimension.height + dimension.margin.top + dimension.margin.bottom))/2 + "px;" )
    .attr("width", dimension.width + dimension.margin.left + dimension.margin.right)
    .attr("height", dimension.height + dimension.margin.top + dimension.margin.bottom);

    const svg = d3.select("svg");
    svg_r = document.querySelector('svg').getBoundingClientRect();

    var maxx = 0, minx = 0, maxy = 0, miny = 0;
    maxx = Math.max(d3.max(TSNEdata, d=>d.x), d3.max(UMAPdata, d=>d.x));
    maxy = Math.max(d3.max(TSNEdata, d=>d.y), d3.max(UMAPdata, d=>d.y));
    minx = Math.min(d3.min(TSNEdata, d=>d.x), d3.min(UMAPdata, d=>d.x));
    miny = Math.min(d3.min(TSNEdata, d=>d.y), d3.min(UMAPdata, d=>d.y));

    svg.append("g")
    .attr("transform", "translate(" + dimension.margin.left + "," + dimension.margin.top + ")");

    // Add X axis
    var x = d3.scaleLinear()
    .domain([minx-5, maxx+5])
    .range([ 0, dimension.width ]);
    svg.append("g")
    .attr("transform", "translate("+dimension.margin.left+"," + (dimension.height + dimension.margin.top)  + ")")
    .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
    .domain([miny-5, maxy+5])
    .range([ dimension.height, 0]);
    svg.append("g")
    .attr("transform", "translate("+dimension.margin.left+","+dimension.margin.top+")")
    .call(d3.axisLeft(y));

    // Add dots
    svg.append('g')
    .attr("class", "TSNE")
    .selectAll("dot")
    .data(TSNEdata)
    .enter()
    .append("circle")
    .attr('class', d=>"TSNE"+d.label)
    .attr("cx", d=>x(d.x))
    .attr("cy", d=>y(d.y))
    .attr("r", 4)
    // .style("fill", function(d) { return C_colors(d.label);})
    .on("mouseover",  highlight)
    .on("mouseleave", doNotHighlight )


    // Add dots
    svg.append('g')
    .attr("class", "UMAP")
    .selectAll("dot")
    .data(UMAPdata)
    .enter()
    .append("circle")
    .attr('class', d=>"UMAP"+d.label)
    .attr("cx", d=>x(d.x))
    .attr("cy", d=>y(d.y))
    .attr("r", 4)
    // .style("fill", function(d) { return C_colors(d.label) + "80";})
    .on("mouseover",  highlight)
    .on("mouseleave", doNotHighlight )


    // calculate centroids

    centroidsTSNE = clusterCentroids(TSNEdata);
    centroidsUMAP = clusterCentroids(UMAPdata);
    console.log(centroidsTSNE);
    console.log(centroidsUMAP);

    // Add centroids
    svg.append('g')
        .attr("class", "TSNE")
        .selectAll("centroid")
        .data(centroidsTSNE)
        .enter()
        .append("rect")
        .attr('class', (d,i)=>"TSNE"+i+" centroid")
        .attr("x", d=>x(d.x)-5)
        .attr("y", d=>y(d.y)-5)
        .attr("width", 10)
        .attr("height", 10)
        .on("mouseover",  highlight)
        .on("mouseleave", doNotHighlight )

    svg.append('g')
        .attr("class", "UMAP")
        .selectAll("centroid")
        .data(centroidsUMAP)
        .enter()
        .append("rect")
        .attr('class', (d,i)=>"UMAP"+i+" centroid")
        .attr("x", d=>x(d.x)-5)
        .attr("y", d=>y(d.y)-5)
        .attr("width", 10)
        .attr("height", 10)
        .on("mouseover",  highlight)
        .on("mouseleave", doNotHighlight )

    // calculate intercluster distances
    var interTSNE = interclusterDist(TSNEdata, centroidsTSNE, "TSNE");
    var interUMAP = interclusterDist(UMAPdata, centroidsUMAP, "UMAP");
    console.log(interTSNE);
    console.log(interUMAP);

    // add lines
    svg.append('g')
        .attr("class", "TSNE")
        .selectAll("line.link")
        .data(interTSNE)
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("x1", d=>x(d.x1))
        .attr("y1", d=>y(d.y1))
        .attr("x2", d=>x(d.x2))
        .attr("y2", d=>y(d.y2))
        .attr("data-dist", d=>d.dist)
        .attr("data-cl1", d=>d.cl1)
        .attr("data-cl2", d=>d.cl2)
        .on("mouseover", showDistance)


    svg.append('g')
        .attr("class", "UMAP")
        .selectAll("line.link")
        .data(interUMAP)
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("x1", d=>x(d.x1))
        .attr("y1", d=>y(d.y1))
        .attr("x2", d=>x(d.x2))
        .attr("y2", d=>y(d.y2))
        .attr("data-dist", d=>d.dist)
        .attr("data-cl1", d=>d.cl1)
        .attr("data-cl2", d=>d.cl2)
        .on("mouseover", showDistance)

    function highlight (event, d){
        document.getElementById("currently").innerText = "cluster " +this.classList[0];
        colour = this.style.fill
        d3.selectAll("." + this.parentNode.classList[0] + " > circle." + this.classList[0])
        .transition()
        .duration(200)
        .style("fill", colour)
        .attr("r", 7)
    }

    // Highlight the specie that is hovered
    function doNotHighlight(d){

        d3.selectAll("." + this.parentNode.classList[0] + " > circle")
        .transition()
        .duration(100)
        .attr("r", 4)
    }

    function showDistance(dist){
        console.log(this.dataset.dist);
        document.getElementById("distance").innerText = this.dataset.dist;
        document.getElementById("currently").innerText =
            "Line between clusters " + this.dataset.cl1 + "-" + this.dataset.cl2;
    }

}
create();

document.addEventListener('readystatechange', event => {
    switch (document.readyState) {
    case "loading":
    console.log("document.readyState: ", document.readyState,
    `- The document is still loading.`
    );
    break;
    case "interactive":
    console.log("document.readyState: ", document.readyState,
    `- The document has finished loading DOM. `,
    `- "DOMContentLoaded" event`
    );
    break;
    case "complete":
    console.log("document.readyState: ", document.readyState,
    `- The page DOM with Sub-resources are now fully loaded. `,
    `- "load" event`
    );
    setTimeout(function(){
        var countsTSNE = clusterCounts(TSNEdata);
        var countsUMAP = clusterCounts(UMAPdata);
        console.log(countsTSNE);
        console.log(countsUMAP);
        var intraTSNE = intraclusterDist(TSNEdata, centroidsTSNE);
        var intraUMAP = intraclusterDist(UMAPdata, centroidsUMAP);
        console.log(intraTSNE);
        console.log(intraUMAP);
        for(i = 0; i < 3; i++){
            document.getElementById("intraclusterDistTSNE"+i).innerText = intraTSNE[i];
            document.getElementById("intraclusterDistUMAP"+i).innerText = intraUMAP[i];

            document.getElementById("clusterCountTSNE"+i).innerText = countsTSNE[i];
            document.getElementById("clusterCountUMAP"+i).innerText = countsUMAP[i];
        }
    }, 400)
    break;
    }
});

function clusterCounts(data){
    let counts = [0, 0, 0];
    for(let i=0; i<3; i++){
        for(let j=0; j<data.length; j++) {
            if (data[j].label === i) {
                counts[i] += 1;
            }
        }
    }
    return counts;
}

function clusterCentroids(data){
    let centroids = [];
    for(let i=0; i<3; i++){
        centroids.push({"x": 0, "y": 0});
        let count = 0;
        for(let j=0; j<data.length; j++){
            if(data[j].label === i){
                centroids[i].x += data[j].x;
                centroids[i].y += data[j].y;
                count += 1;
            }
        }
        centroids[i].x /= count;
        centroids[i].y /= count;
    }
    return centroids;
}

function intraclusterDist(data, centroids){
    let result = [];
    for (let i = 0; i < 3; i++){
        let sum = 0;
        let count = 0;
        for (let j = 0; j < data.length; j++){
            if (data[j].label === i){
                count += 1;
                let distX = data[j].x - centroids[i].x;
                let distY = data[j].y - centroids[i].y;
                sum += Math.sqrt(distX * distX + distY * distY);
            }
        }
        result.push(sum/count * 2);
    }
    return result;
}

function interclusterDist(data, centroids, algo){
    let clusterPairs = [[0,1], [0,2], [1,2]];
    let result = [];
    for (let i = 0; i < 3; i++){
        let pair = clusterPairs[i];
        let cl1 = centroids[pair[0]];
        let cl2 = centroids[pair[1]];
        let distX = cl1.x - cl2.x;
        let distY = cl1.y - cl2.y;
        let dist = Math.sqrt(distX * distX + distY * distY);
        result.push({
            'cl1': algo + pair[0],
            'cl2': algo + pair[1],
            'x1': cl1.x,
            'y1': cl1.y,
            'x2': cl2.x,
            'y2': cl2.y,
            'dist': dist
        });
    }
    return result;
}