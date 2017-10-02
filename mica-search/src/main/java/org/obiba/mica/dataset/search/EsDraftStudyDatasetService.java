/*
 * Copyright (c) 2017 OBiBa. All rights reserved.
 *
 * This program and the accompanying materials
 * are made available under the terms of the GNU Public License v3.0.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

package org.obiba.mica.dataset.search;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.elasticsearch.index.query.QueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.obiba.mica.dataset.domain.StudyDataset;
import org.obiba.mica.dataset.domain.StudyDatasetState;
import org.obiba.mica.dataset.service.CollectionDatasetService;
import org.obiba.mica.dataset.service.DraftStudyDatasetService;
import org.obiba.mica.spi.search.Indexer;
import org.obiba.mica.spi.search.Searcher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.annotation.Nullable;
import javax.inject.Inject;
import java.io.IOException;
import java.util.Collection;
import java.util.stream.Collectors;

@Service
class EsDraftStudyDatasetService extends AbstractEsDatasetService<StudyDataset> implements DraftStudyDatasetService {

  private static final Logger log = LoggerFactory.getLogger(EsDraftStudyDatasetService.class);

  @Inject
  private ObjectMapper objectMapper;

  @Inject
  private CollectionDatasetService collectionDatasetService;

  @Override
  protected StudyDataset processHit(Searcher.DocumentResult res) throws IOException {
    return objectMapper.readValue(res.getSourceInputStream(), StudyDataset.class);
  }

  @Override
  protected String getIndexName() {
    return Indexer.DRAFT_DATASET_INDEX;
  }

  @Override
  protected String getType() {
    return Indexer.DATASET_TYPE;
  }

  @Override
  protected String getStudyIdField() {
    return "studyTable.studyId";
  }

  @Override
  protected QueryBuilder filterByAccess() {
    Collection<String> ids = getAccessibleIdFilter().getValues();
    return ids.isEmpty()
        ? QueryBuilders.boolQuery().mustNot(QueryBuilders.existsQuery("id"))
        : QueryBuilders.idsQuery().ids(ids);
  }

  @Nullable
  @Override
  protected Searcher.IdFilter getAccessibleIdFilter() {
    return new Searcher.IdFilter() {
      @Override
      public Collection<String> getValues() {
        return collectionDatasetService.findAllStates().stream().map(StudyDatasetState::getId)
            .filter(s -> subjectAclService.isPermitted("/draft/collected-dataset", "VIEW", s))
            .collect(Collectors.toList());
      }
    };
  }
}
