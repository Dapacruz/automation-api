function relaunch_job(tmpl_ids) {
    var template_name = document.getElementById("template_name").value;
    if (template_name === "Select Job Template") {
        alert("Please select a job template");
        return
    }
    var template = Object.keys(tmpl_ids).find(key => tmpl_ids[key]["name"] === template_name);
    var data = JSON.stringify({
        job_template_name: template_name,
        job_template: template,
        incident: document.getElementById("snow_incident").value,
        configuration_item: document.getElementById("configuration_item").value,
    });

    fetch("/aap/relaunch/job", {
        method: "POST",
        body: data,
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
    }).then(res => {
            if (res.status > 201) {
                document.getElementById("output").innerHTML = `<span style="color:red;"><i>Status ${res.status}: ${res.statusText}</i></span>`;
                document.getElementById("output").style.display = "";
                throw new Error(`unexpected status code ${res.status}, ${res.statusText}`);
            }
            return res.json()
        }).then(json => {
            console.log(json);
            document.getElementById("status").innerHTML = `${json.results}`;
            document.getElementById("created").innerHTML = `${json.created}`;
            document.getElementById("job_id").innerHTML = `${json.job_id}`;
            document.getElementById("url").innerHTML = `<a href="${json.url}" target="_blank">${json.url}</a>`;
            document.getElementById("output").style.display = "";
        }).catch(err => {
            console.log(err);
        })
}

function enable_input(tmpl_ids) {
    var selected = document.getElementById("template_name").value;
    var template_id = Object.keys(tmpl_ids).find(key => tmpl_ids[key]["name"] === selected);
    var snow_incident_label = document.getElementById("snow_incident_label");
    var snow_incident = document.getElementById("snow_incident");
    var configuration_item_label = document.getElementById("configuration_item_label");
    var configuration_item = document.getElementById("configuration_item");

    if (selected === "Select Job Template") {
        snow_incident_label.hidden=true;
        snow_incident.type="hidden";
        configuration_item_label.hidden=true;
        configuration_item.type="hidden";
        return
    }

    var extra_vars = tmpl_ids[template_id]["extra_vars"];

    if (extra_vars.includes("snow_incident")) {
        snow_incident_label.hidden=false;
        snow_incident.type="text";
    } else {
        snow_incident_label.hidden=true;
        snow_incident.type="hidden";
    }

    if (extra_vars.includes("configuration_item")) {
        configuration_item_label.hidden=false;
        configuration_item.type="text";
    } else {
        configuration_item_label.hidden=true;
        configuration_item.type="hidden";
    }
}

document.getElementById("template_name").dispatchEvent(new Event('change'));

