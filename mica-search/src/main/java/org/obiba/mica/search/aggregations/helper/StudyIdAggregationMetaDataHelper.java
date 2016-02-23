/*
 * Copyright (c) 2015 OBiBa. All rights reserved.
 *
 * This program and the accompanying materials
 * are made available under the terms of the GNU Public License v3.0.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

package org.obiba.mica.search.aggregations.helper;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.inject.Inject;

import org.obiba.mica.search.aggregations.AggregationMetaDataProvider;
import org.obiba.mica.study.domain.Study;
import org.obiba.mica.study.service.PublishedStudyService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

@Component
public class StudyIdAggregationMetaDataHelper extends AbstractIdAggregationMetaDataHelper {

  @Inject
  PublishedStudyService publishedStudyService;

  @Cacheable(value="aggregations-metadata", key = "'study'")
  public Map<String, AggregationMetaDataProvider.LocalizedMetaData> getStudies() {
    List<Study> studies = publishedStudyService.findAll();
    return studies.stream().collect(Collectors
      .toMap(s -> s.getId(), m -> new AggregationMetaDataProvider.LocalizedMetaData(m.getAcronym(), m.getName())));
  }

  @Override
  protected Map<String, AggregationMetaDataProvider.LocalizedMetaData> getIdAggregationMap() {
    return getStudies();
  }
}