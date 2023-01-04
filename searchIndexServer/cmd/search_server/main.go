package main

import (
	"fmt"
	"github.com/braintree/manners"
	"github.com/gin-gonic/gin"
	"github.com/growse/growse.com-blog/search"
	"github.com/spf13/viper"
	"log"
)

func main() {
	viper.SetEnvPrefix("search")
	viper.AutomaticEnv()
	viper.SetDefault("indexPath", "searchIndex")
	viper.SetDefault("port", 8000)

	searchIndexPath := viper.GetString("indexPath")
	port := viper.GetInt("port")

	bleveIndex := search.OpenIndex(searchIndexPath)
	defer bleveIndex.Close()
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()
	router.POST("/search/", SearchHandler(bleveIndex))

	err := manners.ListenAndServe(fmt.Sprintf(":%d", port), router)
	if err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}

type searchForm struct {
	SearchTerm string `form:"term" binding:"required"`
	Page       int    `form:"page" binding:"-"`
}

func SearchHandler(index bleve.Index) func(c *gin.Context) {
	return func(c *gin.Context) {
		searchForm := searchForm{}
		err := c.Bind(&searchForm)
		if err != nil {
			c.String(400, fmt.Sprintf("Unable to bind search params: %v", err))
		}
		log.Printf("Searching for %v", searchForm)

		searchResults, err := SearchIndexForThings(index, searchForm)

		if err != nil {
			log.Printf("Error doing search: %v", err)
			c.String(500, "ERROR")
		} else {
			c.JSON(200, gin.H{
				"timeTaken": searchResults.Took,
				"totalHits": searchResults.Total,
				"hits":      searchResults.Hits,
			})
		}
	}
}

func SearchIndexForThings(index bleve.Index, searchForm searchForm) (*bleve.SearchResult, error) {
	query := bleve.NewMatchQuery(searchForm.SearchTerm)

	searchRequest := bleve.NewSearchRequest(query)
	searchRequest.Highlight = bleve.NewHighlightWithStyle("html")
	searchRequest.Size = 10
	page := searchForm.Page

	if page < 1 {
		page = 1
	}
	searchRequest.From = (page - 1) * searchRequest.Size
	searchRequest.Fields = []string{"title", "published"}
	return index.Search(searchRequest)
}
