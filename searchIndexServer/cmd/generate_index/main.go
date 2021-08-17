package main

import (
	"github.com/growse/growse.com-blog/search"
	"github.com/spf13/viper"
	"log"
	"regexp"
)

func main() {
	viper.SetEnvPrefix("search")
	viper.AutomaticEnv()
	viper.SetDefault("pathPattern", "\\d{4}/\\d{2}/\\d{2}/.+?\\.html$")
	viper.SetDefault("indexRoot", "/usr/share/nginx/html")
	viper.SetDefault("indexPath", "searchIndex")

	searchPathPattern := viper.GetString("pathPattern")
	searchIndexRoot := viper.GetString("indexRoot")
	searchIndexPath := viper.GetString("indexPath")

	pathPattern, err := regexp.Compile(searchPathPattern)
	if err != nil {
		log.Printf("Error building regex %v: %v", searchPathPattern, err)
	}

	search.CreateBleveIndex(searchIndexPath, searchIndexRoot, pathPattern)

}
