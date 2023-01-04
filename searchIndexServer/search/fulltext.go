package search

import (
	"bytes"
	"fmt"
	"github.com/antchfx/htmlquery"
	"github.com/blevesearch/bleve/v2"
	"github.com/blevesearch/bleve/v2/analysis/lang/en"
	"github.com/blevesearch/bleve/v2/mapping"
	strip "github.com/grokify/html-strip-tags-go"
	"github.com/pkg/errors"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"time"
)

type BlogPost struct {
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Published time.Time `json:"published"`
}

func (*BlogPost) Type() string {
	return "blogpost"
}

func OpenIndex(indexPath string) bleve.Index {
	log.Printf("Opening search index at %v", indexPath)
	index, err := bleve.Open(indexPath)
	if err != nil {
		log.Fatalf("Error opening index: %v", err)
	}
	docCount, _ := index.DocCount()
	log.Printf("Index opened: %v documents", docCount)
	return index
}

func CreateBleveIndex(indexPath string, webroot string, pathPattern *regexp.Regexp) chan bool {
	webroot, err := filepath.Abs(webroot)
	if err != nil {
		log.Fatalf("Error resolving webroot: %v", err)
	}
	log.Printf("Indexing files matching %v at %v", pathPattern, webroot)
	if _, err := os.Stat(webroot); err == nil {
		index, err := createOnDiskIndex(indexPath)
		if err != nil {
			log.Fatalf("Error opening index: %v", err)
		}
		addHtmlFilesToIndex(webroot, pathPattern, &index)
		index.Close()
	} else {
		log.Printf("No webroot provided for search: %v", err)
	}
	return nil
}

func buildIndexMapping() (*mapping.IndexMappingImpl, error) {

	indexMapping := bleve.NewIndexMapping()
	indexMapping.DefaultAnalyzer = en.AnalyzerName
	indexMapping.DefaultType = "blogPost"

	englishTextFieldMapping := bleve.NewTextFieldMapping()
	englishTextFieldMapping.Analyzer = en.AnalyzerName

	blogPostMapping := bleve.NewDocumentMapping()
	blogPostMapping.AddFieldMappingsAt("title", englishTextFieldMapping)
	blogPostMapping.AddFieldMappingsAt("content", englishTextFieldMapping)

	indexMapping.DefaultMapping = blogPostMapping

	return indexMapping, nil
}

func createOnDiskIndex(path string) (bleve.Index, error) {
	indexMapping, err := buildIndexMapping()
	if err != nil {
		return nil, err
	}
	if _, err := os.Stat(path); !os.IsNotExist(err) {
		os.RemoveAll(path)
	}
	bleveIndex, err := bleve.New(path, indexMapping)
	return bleveIndex, err
}

func addHtmlFilesToIndex(sourceLocation string, regexPattern *regexp.Regexp, index *bleve.Index) {
	err := filepath.Walk(sourceLocation, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			log.Printf("Error: %v", err)
		}
		if !info.IsDir() && filepath.Ext(info.Name()) == ".html" && regexPattern.MatchString(path) {
			err = addFileToIndex(sourceLocation, path, index)
			if err != nil {
				log.Printf("Error adding %v to index. Skipping: %v", path, err)
			}
		}
		return nil
	})
	if err != nil {
		log.Printf("Error walking the webroot: %v", err)
	} else {
		count, _ := (*index).DocCount()
		log.Printf("Indexing complete. %v items added", count)
	}
}

func addFileToIndex(webroot string, filePath string, index *bleve.Index) error {
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return errors.New("file does not exist")
	}
	contentBytes, err := ioutil.ReadFile(filePath)
	if err != nil {
		log.Printf("Error reading file: %v", err)
		return err
	}
	documentId := getUrlFromFilePath(webroot, filePath)
	if _, err := (*index).Document(documentId); err == nil {
		(*index).Delete(documentId)
	}

	data, err := extractBlogPostFromHTML(contentBytes)
	if err != nil {
		return errors.Wrap(err, fmt.Sprintf("Unable to create indexable content from %v", filePath))
	}
	// index some data
	err = (*index).Index(documentId, data)
	if err != nil {
		return err
	}
	return nil
}

func getUrlFromFilePath(webroot string, filePath string) string {
	return filePath[len(webroot):]
}

func extractBlogPostFromHTML(content []byte) (*BlogPost, error) {
	blogPost := BlogPost{}
	document, err := htmlquery.Parse(bytes.NewReader(content))
	if err != nil {
		log.Fatalf("Error parsing HTML: %v", err)
	}
	article := htmlquery.FindOne(document, "//article[@itemprop='blogPost']")
	if article == nil {
		return nil, errors.New("Can't find an article in that file")
	}
	title := htmlquery.FindOne(article, "/header/h1")
	blogPost.Title = htmlquery.InnerText(title)
	published := htmlquery.FindOne(article, "/header/time[@class='plain']")
	parsedDate, err := time.Parse("2006-01-02", htmlquery.SelectAttr(published, "datetime"))

	if err != nil {
		log.Printf("Error parsing date %v", err)
	} else {
		blogPost.Published = parsedDate
	}

	blogContent := htmlquery.FindOne(article, "/section[@itemprop='articleBody']")
	if blogContent == nil {
		return nil, errors.New("Could not extract content from HTML")
	}
	blogPost.Content = strip.StripTags(htmlquery.InnerText(blogContent))
	return &blogPost, nil
}
