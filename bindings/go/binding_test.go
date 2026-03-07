package tree_sitter_sysml_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/tree-sitter/tree-sitter-sysml"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_sysml.Language())
	if language == nil {
		t.Errorf("Error loading Sysml grammar")
	}
}
