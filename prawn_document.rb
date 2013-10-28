require File.expand_path("../../extensions/prawn_document", __FILE__)
require "test/unit"
 
class TestPrawnDocument < Test::Unit::TestCase
  def setup
    @a = File.expand_path("../../tests/prawn_document_test_a.pdf", __FILE__)
    @b = File.expand_path("../../tests/prawn_document_test_b.pdf", __FILE__)
    @c = File.expand_path("../../tests/prawn_document_test_c.pdf", __FILE__)
    
    Prawn::Document.generate(@a) do |pdf|
      pdf.text("PAGE_A")
    end
    Prawn::Document.generate(@b) do |pdf|
      pdf.text("PAGE_B")
    end
    Prawn::Document.generate(@c, :skip_page_creation => true) do |pdf|
      pdf.start_new_page(:template => @b)
      pdf.concat(@a)
    end
  end
  
  def teardown
    File.delete(@a)
    File.delete(@b)
    File.delete(@c)
  end
  
  def test_concat
    assert_equal Prawn::Document.new(:template => @a).page_count, 1
    assert_equal Prawn::Document.new(:template => @b).page_count, 1
    assert_equal Prawn::Document.new(:template => @c).page_count, 2
  end
end