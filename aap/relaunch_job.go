package aap

import (
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
)

type jobs struct {
	Results []job
}

type job struct {
	Job_Template int
	Extra_Vars   string
	ID           int
	URL          string
	Created      string
	Started      string
	Status       string
}

type postData struct {
	JobTemplate       string `json:"job_template_name"`
	JobTemplateId     string `json:"job_template"`
	Incident          string `json:"incident"`
	ConfigurationItem string `json:"configuration_item"`
}

func LoadRelaunchJobPage(c *gin.Context) {
	c.HTML(http.StatusOK, "relaunch_job.tmpl", gin.H{
		"configuration_item": c.Query("configuration_item"),
		"incident":           c.Query("incident"),
		"job_template_name":  c.Query("job_template_name"),
		"job_template":       c.Query("job_template"),
	})
}

func fetchRunningJobs(httpClient *http.Client, credentials, jobTemplate string) (*jobs, error) {
	url := fmt.Sprintf("%s/api/v2/jobs", viper.GetString("aap.base_url"))
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Basic %s", credentials))

	q := req.URL.Query()
	q.Add("job_template", jobTemplate)
	q.Add("page_size", "100")
	q.Add("order_by", "-id")
	req.URL.RawQuery = q.Encode()

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf(fmt.Sprintf("unexpected status code %s", strconv.Itoa(resp.StatusCode)))
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	jobs := &jobs{}
	err = json.Unmarshal(respBody, jobs)
	if err != nil {
		return nil, err
	}

	return jobs, nil
}

func jobRunning(httpClient *http.Client, credentials, jobTemplate, incident string) (bool, job, error) {
	jobs, err := fetchRunningJobs(httpClient, credentials, jobTemplate)
	if err != nil {
		return false, job{}, err
	}
	for _, j := range jobs.Results {
		if strings.Contains(j.Extra_Vars, incident) && (strings.Contains(j.Status, "pending") || strings.Contains(j.Status, "running")) {
			return true, j, nil
		}
	}
	return false, job{}, nil
}

func relaunchJob(httpClient *http.Client, credentials, jobTemplate, configurationItem, incident string) (*job, error) {
	url := fmt.Sprintf("%s/api/v2/job_templates/%s/launch/", viper.GetString("aap.base_url"), jobTemplate)
	body := []byte(fmt.Sprintf(`{"extra_vars": {"snow_incident": "%s", "configuration_item": "%s"}}`, incident, configurationItem))
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Basic %s", credentials))

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 201 {
		return nil, fmt.Errorf(fmt.Sprintf("unexpected status code %s", strconv.Itoa(resp.StatusCode)))
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	job := &job{}
	if err := json.Unmarshal(respBody, job); err != nil {
		return nil, err
	}

	return job, nil
}

func RelaunchJob(c *gin.Context) {
	var data postData
	c.BindJSON(&data)

	credentials := fmt.Sprintf("%s:%s", viper.GetString("aap.user"), viper.GetString("aap.password"))
	credentials = base64.StdEncoding.EncodeToString([]byte(credentials))

	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	httpClient := &http.Client{Transport: tr}

	// Check to see if a job, for this incident, is already running
	running, runningJob, err := jobRunning(httpClient, credentials, data.JobTemplateId, data.Incident)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if running {
		c.JSON(http.StatusOK, gin.H{
			"results": "job is already running",
			"created": runningJob.Created,
			"started": runningJob.Started,
			"job_id":  runningJob.ID,
			"url":     fmt.Sprintf("%s/#/jobs/playbook/%s/output", viper.GetString("aap.base_url"), strconv.Itoa(runningJob.ID)),
		})
		return
	}

	// Relaunch the job
	executedJob, err := relaunchJob(httpClient, credentials, data.JobTemplateId, data.ConfigurationItem, data.Incident)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"results": "job relaunched",
		"created": executedJob.Created,
		"job_id":  executedJob.ID,
		"url":     fmt.Sprintf("%s/#/jobs/playbook/%s/output", viper.GetString("aap.base_url"), strconv.Itoa(executedJob.ID)),
	})
}
