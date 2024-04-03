// TODO: Add logic to show required fields for selected job template

function relaunch_job(templ_ids) {
    var template_name = document.getElementById("template_name").value
    if (template_name === "Select Job Template") {
        alert("Please select a job template")
        return
    }
    var template = Object.keys(templ_ids).find(key => templ_ids[key]["name"] === template_name)
    var data = JSON.stringify({
        job_template_name: template_name,
        job_template: template,
        incident: document.getElementById("snow_incident").value,
        configuration_item: document.getElementById("configuration_item").value,
    })

    fetch("/aap/relaunch/job", {
        method: "POST",
        body: data,
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
    }).then(res => {
            if (res.status > 201) {
                document.getElementById("output").innerHTML = `<span style="color:red;"><i>Status ${res.status}: ${res.statusText}</i></span>`
                document.getElementById("output").style.display = ""
                throw new Error(`unexpected status code ${res.status}, ${res.statusText}`)
            }
            return res.json()
        }).then(json => {
            console.log(json)
            document.getElementById("status").innerHTML = `${json.results}`
            document.getElementById("created").innerHTML = `${json.created}`
            document.getElementById("job_id").innerHTML = `${json.job_id}`
            document.getElementById("url").innerHTML = `<a href="${json.url}" target="_blank">${json.url}</a>`
            document.getElementById("output").style.display = ""
        }).catch(err => {
            console.log(err)
        })
}

