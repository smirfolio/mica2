/*
 * Copyright (c) 2014 OBiBa. All rights reserved.
 *
 * This program and the accompanying materials
 * are made available under the terms of the GNU Public License v3.0.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

package org.obiba.mica.taxonomy;

import org.obiba.opal.core.domain.taxonomy.Taxonomy;
import org.obiba.opal.core.domain.taxonomy.Vocabulary;

public class TaxonomyVocabularyIndexable extends TaxonomyEntityIndexable<Vocabulary> {

  private final String taxonomyName;

  private final Vocabulary vocabulary;

  public TaxonomyVocabularyIndexable(Taxonomy taxonomy, Vocabulary vocabulary) {
    taxonomyName = taxonomy.getName();
    this.vocabulary = vocabulary;
  }

  @Override
  public String getId() {
    return TaxonomyResolver.asId(taxonomyName, getName());
  }

  @Override
  public String getMappingName() {
    return TaxonomyIndexer.TAXONOMY_VOCABULARY_TYPE;
  }

  @Override
  public String getParentId() {
    return taxonomyName;
  }

  @Override
  protected Vocabulary getTaxonomyEntity() {
    return vocabulary;
  }
}
