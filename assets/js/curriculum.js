/* 凤凰花·智学课程规则引擎 v3
 * 这里只保存规则，不保存教材正文或知识点内容。实际章节、知识点和教材版本由服务端返回。
 */
(function () {
  'use strict';

  const always = ['ethics', 'chinese', 'math', 'pe_health', 'arts', 'labor', 'integrated_practice'];
  const primary = ['science'];
  const upperPrimary = ['english', 'information_technology'];
  const splitJunior = ['english', 'history', 'geography', 'biology', 'information_technology'];

  function gradeNumber(value) {
    const match = String(value == null ? '' : value).match(/[1-9]/);
    return match ? Number(match[0]) : Number(value) || 1;
  }

  function buildOfferings(input) {
    const ctx = Object.assign({ system: 'six_three', grade: 1, scienceRoute: 'physics_chemistry_biology', foreignLanguage: null, term: null }, input || {});
    const grade = gradeNumber(ctx.grade);
    const codes = new Set(always);
    if (grade <= 6) primary.forEach(code => codes.add(code));
    if (grade >= 3 && grade <= 8) upperPrimary.forEach(code => codes.add(code));
    if (grade >= 7) {
      if (ctx.scienceRoute === 'comprehensive_science') codes.add('science');
      else splitJunior.forEach(code => codes.add(code));
      if (grade >= 8 && ctx.scienceRoute !== 'comprehensive_science') codes.add('physics');
      if (grade >= 9 && ctx.scienceRoute !== 'comprehensive_science') codes.add('chemistry');
      if (grade >= 9 && ctx.scienceRoute !== 'comprehensive_science') ['geography', 'biology', 'information_technology'].forEach(code => codes.delete(code));
    }
    if (grade <= 2) codes.delete('english');
    if (ctx.foreignLanguage) codes.add('english');
    const result = Array.from(codes).map(subjectCode => ({
      subjectCode,
      grade,
      term: ctx.term,
      status: 'active',
      source: 'national_default',
      overrideRequired: ['english', 'information_technology', 'science', 'physics', 'chemistry'].includes(subjectCode)
    }));
    return { system: ctx.system, grade, scienceRoute: ctx.scienceRoute, offerings: result };
  }

  window.CURRICULUM = {
    schemaVersion: 3,
    policySource: 'server',
    buildOfferings,
    math: {},
    chinese: {},
    english: {},
    science: {},
    physics: {},
    chemistry: {},
    biology: {},
    history: {},
    geography: {},
    ethics: {},
    information_technology: {}
  };
})();
