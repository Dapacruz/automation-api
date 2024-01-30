package main

import (
	"fmt"

	"github.com/Dapacruz/automation-api/aap"
	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
)

const (
	VERSION           string = "0.0.1"
	VIPER_CONFIG_NAME string = "config"
	VIPER_CONFIG_PATH string = "."
)

func initializeConfig() {
	viper.AddConfigPath(VIPER_CONFIG_PATH)
	viper.SetConfigName(VIPER_CONFIG_NAME)
	viper.SetConfigType("yaml")
	if err := viper.ReadInConfig(); err != nil {
		panic(fmt.Errorf("fatal error config file: %w", err))
	}
	fmt.Println("Viper configuration initialized")
}

func main() {
	initializeConfig()

	router := gin.Default()
	router.GET("/aap/execute/playbook", aap.ExecutePlaybook)

	router.Run(fmt.Sprintf("localhost:%s", viper.GetString("port")))
}
