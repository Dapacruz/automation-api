function relaunch_job() {
    var data = JSON.stringify({
        job_template: document.getElementById("job_template").value,
        job_template_id: document.getElementById("job_template_id").value,
        incident: document.getElementById("incident").value,
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
