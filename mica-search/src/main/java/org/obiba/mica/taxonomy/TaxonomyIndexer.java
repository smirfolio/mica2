/*
 * Copyright (c) 2018 OBiBa. All rights reserved.
 *
 * This program and the accompanying materials
 * are made available under the terms of the GNU Public License v3.0.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

package org.obiba.mica.taxonomy;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.Lists;
import com.google.common.eventbus.Subscribe;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.obiba.mica.micaConfig.event.OpalTaxonomiesUpdatedEvent;
import org.obiba.mica.micaConfig.event.TaxonomiesUpdatedEvent;
import org.obiba.mica.micaConfig.service.TaxonomyService;
import org.obiba.mica.spi.search.Indexer;
import org.obiba.mica.spi.search.TaxonomyTarget;
import org.obiba.opal.core.domain.taxonomy.Taxonomy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import javax.inject.Inject;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class TaxonomyIndexer {

  private static final Logger log = LoggerFactory.getLogger(TaxonomyIndexer.class);

  @Inject
  private TaxonomyService taxonomyService;

  @Inject
  private Indexer indexer;

  @Async
  @Subscribe
  public void opalTaxonomiesUpdatedEvent(OpalTaxonomiesUpdatedEvent event) {
    log.info("Reindex all opal taxonomies");
    index(
      TaxonomyTarget.VARIABLE,
      event.extractOpalTaxonomies()
        .stream()
        .filter(t -> taxonomyService.metaTaxonomyContains(t.getName()))
        .collect(Collectors.toList()));
  }

  @Async
  @Subscribe
  public void taxonomiesUpdated(TaxonomiesUpdatedEvent event) {
    // reindex all taxonomies if target is TAXONOMY or there is no target
    if ((event.getTaxonomyTarget() == null && event.getTaxonomyName() == null) || event.getTaxonomyTarget() == TaxonomyTarget.TAXONOMY) {
      log.info("All taxonomies were updated");
      if(indexer.hasIndex(Indexer.TAXONOMY_INDEX)) indexer.dropIndex(Indexer.TAXONOMY_INDEX);
      index(TaxonomyTarget.VARIABLE,
        ImmutableList.<Taxonomy>builder().addAll(taxonomyService.getOpalTaxonomies().stream() //
          .filter(t -> taxonomyService.metaTaxonomyContains(t.getName())).collect(Collectors.toList())) //
          .add(taxonomyService.getVariableTaxonomy()) //
          .build());
      index(TaxonomyTarget.STUDY, Lists.newArrayList(taxonomyService.getStudyTaxonomy()));
      index(TaxonomyTarget.DATASET, Lists.newArrayList(taxonomyService.getDatasetTaxonomy()));
      index(TaxonomyTarget.NETWORK, Lists.newArrayList(taxonomyService.getNetworkTaxonomy()));
    } else {
      Map.Entry<String, String> termQuery = ImmutablePair.of("taxonomyName", event.getTaxonomyName());
      indexer.delete(Indexer.TAXONOMY_INDEX, new String[] {Indexer.TAXONOMY_TYPE, Indexer.TAXONOMY_VOCABULARY_TYPE, Indexer.TAXONOMY_TERM_TYPE}, termQuery);

      switch (event.getTaxonomyTarget()) {
        case STUDY:
          log.info("Study taxonomies were updated");
          index(TaxonomyTarget.STUDY, Lists.newArrayList(taxonomyService.getStudyTaxonomy()));
          break;
        case NETWORK:
          log.info("Network taxonomies were updated");
          index(TaxonomyTarget.NETWORK, Lists.newArrayList(taxonomyService.getNetworkTaxonomy()));
          break;
        case DATASET:
          log.info("Dataset taxonomies were updated");
          index(TaxonomyTarget.DATASET, Lists.newArrayList(taxonomyService.getDatasetTaxonomy()));
          break;
        case VARIABLE:
          log.info("Variable taxonomies were updated");
          index(TaxonomyTarget.VARIABLE, Lists.newArrayList(taxonomyService.getVariableTaxonomy()));
          break;
      }
    }
  }

  private void index(TaxonomyTarget target, List<Taxonomy> taxonomies) {
    taxonomies.forEach(taxo -> {
      indexer.index(Indexer.TAXONOMY_INDEX, new TaxonomyIndexable(target, taxo));
      if(taxo.hasVocabularies()) taxo.getVocabularies().forEach(voc -> {
        indexer.index(Indexer.TAXONOMY_INDEX, new TaxonomyVocabularyIndexable(target, taxo, voc));
        if(voc.hasTerms()) voc.getTerms().forEach(
          term -> indexer.index(Indexer.TAXONOMY_INDEX, new TaxonomyTermIndexable(target, taxo, voc, term)));
      });
    });
  }
}
