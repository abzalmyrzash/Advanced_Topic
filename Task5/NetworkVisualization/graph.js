const waitForFrame = async () =>
    new Promise((resolve) => {
        requestAnimationFrame(resolve);
    });

const MAX_WEIGHT = 5;
const MIN_WEIGHT = 1;

async function createForceLayout() {
    const nodes = await d3.csv("nodelist.csv");
    const edges = await d3.csv("edgelist.csv");
    const roles = ["employee", "manager", "contractor"];
    const roleScale = d3
        .scaleOrdinal()
        .domain(["contractor", "employee", "manager"])
        .range(["#75739F", "#41A368", "#FE9922"]);

    const nodeHash = nodes.reduce((hash, node) => {
        hash[node.id] = node;
        return hash;
    }, {});
    var lastNodeId = 0;

    edges.forEach((edge) => {
        edge.weight = parseInt(edge.weight);
        edge.source = nodeHash[edge.source];
        edge.target = nodeHash[edge.target];
    });

    // const edgeHash = edges.reduce((hash, edge) => {
    //     edges[`${edge.source.id}-${edge.target.id}`] = edge;
    //     return hash;
    // }, {});

    const linkForce = d3.forceLink();

    const simulation = d3
        .forceSimulation()
        .force("charge", d3.forceManyBody().strength(-40))
        .force("center", d3.forceCenter().x(300).y(300))
        .force("link", linkForce)
        .nodes(nodes)
        .on("tick", forceTick);

    simulation.force("link").links(edges);

    // graph
    const dimension = {
        width: window.innerWidth * 0.6,
        height: window.innerWidth * 0.6,
        margin: {
            top: 50,
            right: 10,
            bottom: 10,
            left: 55,
        },
    };

    dimension.boundedWidth =
        dimension.width - dimension.margin.right - dimension.margin.left;

    dimension.boundedHeight =
        dimension.height - dimension.margin.top - dimension.margin.bottom;

    const graphDiv = d3
        .select("#graphDiv")
        .append("svg")
        .attr("width", dimension.width)
        .attr("height", dimension.height);

    var nodeEnter;

    await createEdges();
    createNodes();

    function createNodes() {
        simulation.nodes(nodes);
        nodeEnter = graphDiv
            .selectAll("g.node")
            .data(nodes, (d) => d.id)
            .enter()
            .append("g")
            .call(drag(simulation))
            .attr("class", "node");

        nodeEnter
            .append("circle")
            .style("cursor", "pointer")
            .attr("r", 10)
            .style("fill", (d) => roleScale(d.role))
            .on("click", handleNodeClick);
        nodeEnter
            .append("foreignObject")
            .classed("node-text", true)
            .attr("x", -25)
            .attr("y", 8)
            .append("xhtml:body")
            .append("xhtml:span")
            .attr("contenteditable", true)
            .html((d) => d.id)
            .on("click", function () {
                nodeEnter.on(".drag", null);
            })
            .on("blur", function () {
                nodeEnter.call(drag(simulation));
            })
            .attr("transform", (d) => `translate(${d.x},${d.y})`);
        forceTick();
    }

    function createNode(newNode){
        nodes.push(newNode);
        console.log(nodes);
        nodeHash["Node " + lastNodeId] = newNode;
        createNodes();
    }

    function getNodeIndex(nodeId){
        return nodes.findIndex((d) => d.id === nodeId);
    }

    function deleteNode(nodeId){
        let index = getNodeIndex(nodeId);
        if(index === -1){
            console.log(`Node ${nodeId} not found!`)
            return;
        }
        nodes.splice(index, 1);
        delete nodeHash[nodeId];
        console.log(nodes);

        graphDiv
            .selectAll("g.node")
            .data(nodes, (d) => d.id)
            .exit()
            .remove();

        // delete any connections with other nodes
        for(let i = 0; i < nodes.length; i++){
            deleteEdge(nodeId, nodes[i].id);
            deleteEdge(nodes[i].id, nodeId);
        }

        simulation
            .force("charge", d3.forceManyBody().strength(-40))
            .force("center", d3.forceCenter().x(300).y(300))
            .force("link", linkForce)
            .nodes(nodes)
            .on("tick", forceTick)
            .force("link").links(edges);
    }

    function nextRole(role){
        for(let i = 0; i < roles.length; i++){
            if(roles[i] === role) {
                if(i < roles.length - 1) return roles[i+1];
                return roles[0];
            }
        }
    }

    function changeNodeRole(nodeId){
        let index = getNodeIndex(nodeId);
        if(index === -1){
            console.log(`Node ${nodeId} not found!`)
            return;
        }
        nodes[index].role = nextRole(nodes[index].role);
        console.log(nodes[index].role)
        createNodes();
        graphDiv
            .selectAll("g.node")
            .data(nodes, (d) => d.id)
            .selectAll("circle")
            .style("fill", (d) => roleScale(d.role));
    }


    async function createEdges() {
        graphDiv
            .selectAll("line.link")
            .data(edges, (d) => `${d.source.id}-${d.target.id}`)
            .enter()
            .append("line")
            .attr("class", "link")
            .style("opacity", 0.5)
            .on("click", (event, d) => {
                console.log("event", event);
                if (event.altKey){
                    deleteEdge(d.source.id, d.target.id);
                    return;
                }
                if(event.ctrlKey){
                    weakenEdge(d.source.id, d.target.id);
                    return;
                }
                if(event.shiftKey) {
                    strengthenEdge(d.source.id, d.target.id);
                }
            })
            .style("stroke-width", (d) => Math.sqrt(d.weight)*3);
        forceTick();
        updateEdges();
    }

    async function createEdge(source, target) {
        edges.push({
            source: nodeHash[source],
            target: nodeHash[target],
            weight: 3,
        });
        simulation.force("link").links(edges);
        await createEdges();
    }

    function updateEdges() {
        graphDiv
            .selectAll("line.link")
            .data(edges, (d) => `${d.source.id}-${d.target.id}`)
            .style("stroke-width", (d) => Math.sqrt(d.weight)*3)
            .exit()
            .remove();
    }

    // change nodes, links
    function getEdgeIndex(sourceId, targetId) {
        return edges.findIndex(
            (d) => d.target.id === targetId && d.source.id === sourceId
        );
    }
    function deleteEdge(sourceId, targetId) {
        const index = getEdgeIndex(sourceId, targetId);
        if(index === -1){
            console.log(`Edge ${sourceId}-${targetId} not found!`)
            return;
        }
        edges.splice(index, 1);
        updateEdges();
    }
    function strengthenEdge(sourceId, targetId) {
        const index = getEdgeIndex(sourceId, targetId);
        edges[index].weight = Math.min(MAX_WEIGHT, edges[index].weight + 1);
        console.log(edges[index].weight);
        updateEdges();
    }
    function weakenEdge(sourceId, targetId) {
        const index = getEdgeIndex(sourceId, targetId);
        edges[index].weight = Math.max(MIN_WEIGHT, edges[index].weight - 1);
        console.log(edges[index].weight);
        updateEdges();
    }

    let sourceNodeId = null;
    const clearSelection = () => {
        sourceNodeId = null;
        nodeEnter
            .selectAll("circle")
            .attr("stroke", "#9A8B7A")
            .attr("stroke-width", "1px");
    };
    document.body.addEventListener("mousedown", (event) => {
        if (event.target.nodeName !== "circle") {
            clearSelection();
        }
    });
    document.body.querySelector("#graphDiv")
        .addEventListener("dblclick", (event) => {
        if(event.target.nodeName !== "circle") {
            lastNodeId += 1;
            var rect = event.target.getBoundingClientRect();
            let newNode = {
                id: "Node " + lastNodeId,
                role: "employee",
                salary: 100000,
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            }
            createNode(newNode);
        }
    });
    async function handleNodeClick (event, data) {
        if(event.altKey){
            deleteNode(data.id);
            return;
        }
        if(event.shiftKey){
            changeNodeRole(data.id);
            return;
        }
        const { id } = data;
        const isAlreadyLinked = edges.some((node) => {
            const iDs = [node.target.id, node.source.id];
            return iDs.includes(id) && iDs.includes(sourceNodeId);
        });
        if (isAlreadyLinked) return;
        if (event.ctrlKey && sourceNodeId) {
            createEdge(sourceNodeId, id);
            await waitForFrame();
            clearSelection();
            return;
        }
        clearSelection();
        sourceNodeId = nodeEnter
            .selectAll("circle")
            .filter((data) => data.id === id)
            .attr("stroke-width", "3px")
            .attr("stroke", "lightblue")
            .datum().id;
    }

    function forceTick() {
        d3.selectAll("line.link")
            .attr("x1", (d) => d.source.x)
            .attr("x2", (d) => d.target.x)
            .attr("y1", (d) => d.source.y)
            .attr("y2", (d) => d.target.y);
        d3.selectAll("g.node").attr("transform", (d) => `translate(${d.x},${d.y})`);
    }

    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }
}

createForceLayout();