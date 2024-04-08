function relaunch_job(tmpl_ids) {
    const tmpl_name = document.getElementById("template_name").value;
    if (tmpl_name === "Select Job Template") {
        alert("Please select a job template");
        return;
    }
    const tmpl_id = Object.keys(tmpl_ids).find(key => tmpl_ids[key]["name"] === tmpl_name);

    // Process extra_vars to be posted to AAP
    let extra_vars = tmpl_ids[tmpl_id]["extra_vars"];
    const req_vars = Object.keys(extra_vars);
    extra_vars["job_template"] = tmpl_id;
    for (let i = 0; i < req_vars.length; i++) {
        let rv = req_vars[i];
        const input = document.getElementById(rv);
        extra_vars[rv] = input.value;
        if (extra_vars[rv] === "") {
            alert(`${input.placeholder} is required`);
            return;
        }
    }

    // Relaunch job
    const data = JSON.stringify(extra_vars);
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
            return res.json();
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

function show_input(tmpl_ids) {
    const selected_tmpl = document.getElementById("template_name").value;
    const tmpl_id = Object.keys(tmpl_ids).find(key => tmpl_ids[key]["name"] === selected_tmpl);
    const snow_inc_label = document.getElementById("snow_incident_label");
    const snow_inc = document.getElementById("snow_incident");
    const ci_label = document.getElementById("configuration_item_label");
    const ci = document.getElementById("configuration_item");

    if (selected_tmpl === "Select Job Template") {
        snow_inc_label.hidden = true;
        snow_inc.type = "hidden";
        ci_label.hidden=true;
        ci.type = "hidden";
        return;
    }

    const extra_vars = tmpl_ids[tmpl_id]["extra_vars"];

    if ("snow_incident" in extra_vars) {
        snow_inc_label.hidden = false;
        snow_inc.type = "text";
    } else {
        snow_inc_label.hidden = true;
        snow_inc.type = "hidden";
    }

    if ("configuration_item" in extra_vars) {
        ci_label.hidden = false;
        ci.type = "text";
    } else {
        ci_label.hidden = true;
        ci.type = "hidden";
    }
}

document.getElementById("template_name").dispatchEvent(new Event('change'));

